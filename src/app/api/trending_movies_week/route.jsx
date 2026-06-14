import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { createRouteLogger } from "@/lib/api-debug";
import { fetchWithTimeout } from "@/lib/server-fetch";

const calculateWeeklyTrendingScore = (likes7d, ratings7d, watchlist7d, reviews7d) =>
  likes7d * 4 + reviews7d * 3 + watchlist7d * 2 + ratings7d;

const TMDB_BASE = "https://api.themoviedb.org/3";

const tmdbApiKey = () => {
  const key =
    process.env.TMDB_API_KEY ||
    process.env.MOVIEDB_API_KEY ||
    process.env.NEXT_PUBLIC_API_KEY;

  if (!key) {
    throw new Error("TMDB API key is not configured. Set TMDB_API_KEY or MOVIEDB_API_KEY.");
  }

  return key;
};

async function enrichTmdbMovie(tmdbId, apiKey) {
  if (!tmdbId) return null;

  try {
    const res = await fetchWithTimeout(
      `${TMDB_BASE}/movie/${tmdbId}?api_key=${apiKey}&language=en-US`,
      { next: { revalidate: 900 }, timeoutMs: 8000 }
    );

    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export const GET = async () => {
  const logger = createRouteLogger("GET /api/trending_movies_week");
  const handlerTimer = logger.start("handler_total");

  try {
    const apiKey = tmdbApiKey();
    const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    // ✅ Debug (remove later)
    // const [totalLikes, likesLast7d, totalRatings, ratingsLast7d] = await Promise.all([
    //   prisma.liked.count(),
    //   prisma.liked.count({ where: { addedAt: { gte: since } } }),
    //   prisma.rating.count(),
    //   prisma.rating.count({ where: { createdAt: { gte: since } } }),
    // ]);
    // console.log("since:", since.toISOString());
    // console.log({ totalLikes, likesLast7d, totalRatings, ratingsLast7d });

    logger.log("db query start", { since: since.toISOString() });
    const dbTimer = logger.start("db_query");
    const movies = await prisma.movie.findMany({
      select: {
        id: true,
        tmdbId: true,
        title: true,
        posterUrl: true,

        // only last 7 days
        liked: { where: { addedAt: { gte: since } }, select: { id: true } },
        ratings: {
          where: { createdAt: { gte: since } },
          select: { value: true }, 
        },
        watchlist: { where: { addedAt: { gte: since } }, select: { id: true } },
        reviews: { where: { createdAt: { gte: since } }, select: { id: true } },
      },
    });
    logger.end(dbTimer);
    logger.log("db query end", { movieCount: movies.length });

    const scoringTimer = logger.start("score_movies");
    const weeklyTrending = movies
      .map((m) => {
        const likes7d = m.liked?.length ?? 0;
        const ratings7d = m.ratings?.length ?? 0;
        const watchlist7d = m.watchlist?.length ?? 0;
        const reviews7d = m.reviews?.length ?? 0;

        const avgRating7d =
          ratings7d > 0
            ? m.ratings.reduce((sum, r) => sum + (Number(r.value) || 0), 0) / ratings7d
            : 0;

        const trendingScore = calculateWeeklyTrendingScore(
          likes7d,
          ratings7d,
          watchlist7d,
          reviews7d
        );

        return {
          id: m.id,
          tmdbId: m.tmdbId,
          title: m.title,
          posterUrl: m.posterUrl,

          likes7d,
          ratings7d,
          avgRating7d,
          watchlist7d,
          reviews7d,

          trendingScore,
        };
      })
      .sort((a, b) => b.trendingScore - a.trendingScore);
    logger.end(scoringTimer);

    const topTrending = weeklyTrending.slice(0, 20);
    logger.log("tmdb enrichment start", { movieCount: topTrending.length });
    const enrichmentTimer = logger.start("tmdb_enrichment");
    const enrichedMeta = await Promise.all(
      topTrending.map(async (movie) => {
        const tmdbMovie = await enrichTmdbMovie(movie.tmdbId, apiKey);
        return {
          ...movie,
          posterPath: tmdbMovie?.poster_path ?? null,
          releaseDate: tmdbMovie?.release_date ?? null,
          tmdbVoteAverage: Number(tmdbMovie?.vote_average ?? 0),
        };
      })
    );
    logger.end(enrichmentTimer);

    return NextResponse.json(enrichedMeta, {
      status: 200,
      headers: {
        "Cache-Control": "public, s-maxage=900, stale-while-revalidate=3600",
      },
    });
  } catch (err) {
    console.error("Error fetching weekly trending movies:", err);
    return NextResponse.json(
      { message: "Error fetching weekly trending movies.", error: err?.message },
      { status: 500 }
    );
  } finally {
    logger.end(handlerTimer);
  }
};
