import { NextRequest, NextResponse } from "next/server";

const TMDB_BASE = "https://api.themoviedb.org/3";

type Provider = {
  provider_id: number;
  provider_name: string;
  logo_path?: string | null;
};

type ReleaseDateEntry = {
  certification?: string;
};

type ReleaseDateResult = {
  iso_3166_1?: string;
  release_dates?: ReleaseDateEntry[];
};

type WatchProviderResult = {
  flatrate?: Provider[];
  rent?: Provider[];
  buy?: Provider[];
};

type MovieCardDetailResponse = {
  id: number;
  imdb_id?: string | null;
  overview?: string;
  release_date?: string;
  runtime?: number | null;
  release_dates?: {
    results?: ReleaseDateResult[];
  };
  "watch/providers"?: {
    results?: Record<string, WatchProviderResult>;
  };
};

type MovieCardEnrichment = {
  overview: string;
  runtime: number | null;
  certification: string | null;
  providers: Provider[];
  imdbRating: number | null;
  rottenTomatoes: string | null;
  inTheaters: boolean;
};

function tmdbApiKey() {
  return (
    process.env.TMDB_API_KEY ||
    process.env.MOVIEDB_API_KEY ||
    process.env.NEXT_PUBLIC_API_KEY ||
    ""
  );
}

function omdbApiKey() {
  return process.env.OMDB_API_KEY || process.env.NEXT_PUBLIC_OMDB_API_KEY || "";
}

function isNewInTheaters(releaseDate?: string | null) {
  if (!releaseDate) return false;
  const parsed = new Date(releaseDate);
  if (Number.isNaN(parsed.getTime())) return false;
  const daysSinceRelease = (Date.now() - parsed.getTime()) / (1000 * 60 * 60 * 24);
  return daysSinceRelease >= 0 && daysSinceRelease <= 45;
}

function pickCertification(results: ReleaseDateResult[] = []) {
  const preferred =
    results.find((release) => release.iso_3166_1 === "IN") ||
    results.find((release) => release.iso_3166_1 === "US") ||
    null;

  return (
    preferred?.release_dates?.find((entry) => entry?.certification)?.certification || null
  );
}

function pickProviders(results?: Record<string, WatchProviderResult>) {
  if (!results) return [];

  const preferred =
    results.IN ||
    results.US ||
    Object.values(results).find(
      (entry) => (entry?.flatrate?.length || 0) > 0 || (entry?.rent?.length || 0) > 0 || (entry?.buy?.length || 0) > 0
    );

  return preferred?.flatrate || preferred?.rent || preferred?.buy || [];
}

async function fetchTmdbMovieCard(movieId: string) {
  const apiKey = tmdbApiKey();
  if (!apiKey) {
    throw new Error("TMDB API key is not configured");
  }

  const query = new URLSearchParams({
    api_key: apiKey,
    language: "en-US",
    append_to_response: "release_dates,watch/providers",
  });

  const res = await fetch(`${TMDB_BASE}/movie/${movieId}?${query.toString()}`, {
    next: { revalidate: 900 },
  });

  if (!res.ok) {
    throw new Error(`TMDB card request failed for ${movieId}: ${res.status}`);
  }

  return (await res.json()) as MovieCardDetailResponse;
}

async function fetchOmdbRatings(imdbId?: string | null) {
  const key = omdbApiKey();
  if (!key || !imdbId) {
    return {
      imdbRating: null as number | null,
      rottenTomatoes: null as string | null,
    };
  }

  try {
    const res = await fetch(`https://www.omdbapi.com/?apikey=${key}&i=${imdbId}`, {
      next: { revalidate: 900 },
    });

    if (!res.ok) {
      throw new Error(`OMDb request failed: ${res.status}`);
    }

    const json = await res.json();
    const imdbRating = Number.parseFloat(json?.imdbRating || "");
    const rottenTomatoes =
      (json?.Ratings || []).find((rating: { Source?: string; Value?: string }) => rating.Source === "Rotten Tomatoes")
        ?.Value || null;

    return {
      imdbRating: Number.isFinite(imdbRating) ? imdbRating : null,
      rottenTomatoes,
    };
  } catch (error) {
    console.error("OMDb card ratings fetch failed", error);
    return {
      imdbRating: null as number | null,
      rottenTomatoes: null as string | null,
    };
  }
}

export async function GET(request: NextRequest) {
  const idsParam = request.nextUrl.searchParams.get("ids") || "";
  const ids = Array.from(
    new Set(
      idsParam
        .split(",")
        .map((value) => value.trim())
        .filter((value) => /^\d+$/.test(value))
    )
  ).slice(0, 12);

  if (!ids.length) {
    return NextResponse.json({ error: "ids query param is required" }, { status: 400 });
  }

  const entries = await Promise.all(
    ids.map(async (movieId) => {
      try {
        const detail = await fetchTmdbMovieCard(movieId);
        const ratings = await fetchOmdbRatings(detail?.imdb_id);

        return [
          movieId,
          {
            overview: detail?.overview || "",
            runtime: typeof detail?.runtime === "number" ? detail.runtime : null,
            certification: pickCertification(detail?.release_dates?.results || []),
            providers: pickProviders(detail?.["watch/providers"]?.results),
            imdbRating: ratings.imdbRating,
            rottenTomatoes: ratings.rottenTomatoes,
            inTheaters: isNewInTheaters(detail?.release_date),
          },
        ] as const;
      } catch (error) {
        console.error(`Movie card enrichment failed for ${movieId}`, error);
        return null;
      }
    })
  );

  return NextResponse.json(
    {
      items: Object.fromEntries(
        entries.filter(
          (entry): entry is readonly [string, MovieCardEnrichment] => entry !== null
        )
      ),
    },
    {
      headers: {
        "Cache-Control": "public, s-maxage=900, stale-while-revalidate=3600",
      },
    }
  );
}
