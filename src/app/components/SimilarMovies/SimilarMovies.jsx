"use client";

import { useEffect, useMemo, useState } from "react";
import MovieBlock from "@/app/components/MovieBlock/MovieBlock";

const SECTION_HEADING_CLASS = "text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white";

function toMovieBlockItem(movie, enrichment = null) {
  return {
    id: movie?.id,
    title: movie?.title || movie?.name || "Untitled",
    original_title: movie?.original_title || movie?.title || movie?.name || "Untitled",
    poster_path: movie?.poster_path ?? movie?.posterPath ?? null,
    posterUrl: movie?.posterUrl ?? null,
    vote_average: Number(movie?.vote_average ?? movie?.voteAverage ?? 0),
    release_date: movie?.release_date ?? movie?.releaseDate ?? null,
    overview: enrichment?.overview ?? movie?.overview ?? "",
    runtime: enrichment?.runtime ?? null,
    certification: enrichment?.certification ?? null,
    imdbRating: enrichment?.imdbRating ?? null,
    rottenTomatoes: enrichment?.rottenTomatoes ?? null,
    providers: enrichment?.providers ?? [],
    inTheaters: enrichment?.inTheaters ?? false,
  };
}

export default function SimilarMovies({ item, recommendations = [] }) {
  const visibleRecommendations = useMemo(() => recommendations.slice(0, 12), [recommendations]);
  const [enrichmentMap, setEnrichmentMap] = useState({});

  useEffect(() => {
    const ids = Array.from(
      new Set(
        visibleRecommendations
          .map((movie) => String(movie?.id || "").trim())
          .filter((id) => /^\d+$/.test(id))
      )
    );

    if (!ids.length) {
      setEnrichmentMap({});
      return;
    }

    const controller = new AbortController();

    const loadEnrichment = async () => {
      try {
        const res = await fetch(`/api/movies/cards?ids=${ids.join(",")}`, {
          signal: controller.signal,
        });
        const json = await res.json();

        if (!res.ok) {
          throw new Error(json?.error || "Failed to load card details");
        }

        setEnrichmentMap(json?.items || {});
      } catch (error) {
        if (error?.name !== "AbortError") {
          console.error("Failed to load similar movie card enrichment", error);
        }
      }
    };

    void loadEnrichment();

    return () => controller.abort();
  }, [visibleRecommendations]);

  if (!recommendations.length) {
    return (
      <section className="mt-10 rounded-2xl border border-white/20 bg-black/30 backdrop-blur-xl p-4 md:p-6 text-center">
        <h2 className={SECTION_HEADING_CLASS}>Because you watched {item?.title || "this movie"}</h2>
      </section>
    );
  }

  return (
    <section className="mt-10 rounded-2xl border border-white/20 bg-black/30 backdrop-blur-xl p-4 md:p-6 space-y-4">
      <header className="space-y-2 text-center">
        <h2 className={SECTION_HEADING_CLASS}>
          Because you watched {item?.title || "this movie"}
        </h2>
      </header>

      <div className="grid grid-cols-2 gap-x-3 gap-y-8 pt-4 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6">
        {visibleRecommendations.map((movie, index) => (
          <div key={`hybrid-${movie.id}`} className="w-full max-w-[170px] justify-self-center pt-8">
            <MovieBlock
              item={toMovieBlockItem(movie, enrichmentMap[String(movie.id)] || null)}
              index={index}
              enhanced
            />
          </div>
        ))}
      </div>
    </section>
  );
}
