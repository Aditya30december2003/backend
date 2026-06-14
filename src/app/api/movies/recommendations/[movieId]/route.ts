import { NextResponse } from "next/server";
import prisma from "@/app/libs/prismaDB";
import { getHybridRecommendationsForMovie } from "@/app/libs/movieRecommendations";
import { createRouteLogger } from "@/lib/api-debug";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ movieId: string }> | { movieId: string } }
) {
  const logger = createRouteLogger("GET /api/movies/recommendations/[movieId]");
  const handlerTimer = logger.start("handler_total");

  try {
    const resolvedParams = await params;
    const movieId = String(resolvedParams?.movieId || "").trim();
    if (!movieId) {
      return NextResponse.json({ error: "movieId is required" }, { status: 400 });
    }
    if (!/^\d+$/.test(movieId)) {
      return NextResponse.json(
        { error: "movieId must be a numeric TMDB id" },
        { status: 400 }
      );
    }

    logger.log("local movie lookup start", { movieId });
    const localMovieTimer = logger.start("local_movie_lookup");
    const localMovie = await prisma.movie.findUnique({
      where: { tmdbId: movieId },
      select: {
        id: true,
        title: true,
      },
    });
    logger.end(localMovieTimer);

    logger.log("hybrid recommendations start", {
      movieId,
      hasLocalMovie: Boolean(localMovie),
    });
    const recommendationsTimer = logger.start("hybrid_recommendations");
    const recommendations = await getHybridRecommendationsForMovie({
      tmdbId: movieId,
      dbMovieId: localMovie?.id ?? null,
      title: localMovie?.title ?? null,
      limit: 16,
    });
    logger.end(recommendationsTimer);
    logger.log("hybrid recommendations end", {
      movieId,
      itemCount:
        recommendations && typeof recommendations === "object" && Array.isArray((recommendations as any).items)
          ? (recommendations as any).items.length
          : 0,
    });

    return NextResponse.json(
      recommendations || {
        seedMovieTitle: "",
        seedTmdbId: movieId,
        subtitle: "",
        signals: {
          director: null,
          actors: [],
          genres: [],
        },
        items: [],
      },
      {
        headers: {
          "Cache-Control": "public, s-maxage=900, stale-while-revalidate=3600",
        },
      }
    );
  } catch (error) {
    console.error("GET /api/movies/recommendations/[movieId] error", error);
    return NextResponse.json(
      { error: "Failed to load movie recommendations" },
      { status: 500 }
    );
  } finally {
    logger.end(handlerTimer);
  }
}
