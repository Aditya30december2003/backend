import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { isDefaultListLike, mapListMovie } from "@/app/libs/lists";
import {
  addMovieToDefaultOwnerWatchlistIfNeeded,
  addMovieToWatchlist,
  getCurrentUserOrNull,
  recordWatchlistActivity,
} from "@/app/libs/watchlists";

export const maxDuration = 30;
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const me = await getCurrentUserOrNull();
    if (!me) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const ownedList = await prisma.watchlist.findUnique({
      where: { id: params.id },
      select: { id: true, ownerId: true, slug: true, isSystemDefault: true },
    });

    if (!ownedList || isDefaultListLike(ownedList)) {
      return NextResponse.json({ error: "List not found" }, { status: 404 });
    }

    if (ownedList.ownerId !== me.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const movieId =
      typeof body?.movieId === "string"
        ? body.movieId.trim()
        : String(body?.movieId || "").trim();
    const title = typeof body?.title === "string" ? body.title : null;
    const posterUrl =
      typeof body?.posterPath === "string"
        ? body.posterPath
        : typeof body?.posterUrl === "string"
          ? body.posterUrl
          : null;
    const releaseDate =
      typeof body?.releaseDate === "string" && body.releaseDate.trim()
        ? body.releaseDate.trim()
        : null;

    if (!movieId) {
      return NextResponse.json({ error: "movieId is required" }, { status: 400 });
    }

    const { movie } = await addMovieToWatchlist({
      watchlistId: ownedList.id,
      actorUserId: me.id,
      movieId,
      title,
      posterUrl,
      releaseDate,
    });

    const defaultWatchlist = await addMovieToDefaultOwnerWatchlistIfNeeded({
      ownerId: ownedList.ownerId,
      sourceWatchlistId: ownedList.id,
      actorUserId: me.id,
      movieDbId: movie.id,
    });

    try {
      await prisma.legacyWatchlist.upsert({
        where: {
          userId_movieId: {
            userId: ownedList.ownerId,
            movieId: movie.id,
          },
        },
        update: {},
        create: {
          userId: ownedList.ownerId,
          movieId: movie.id,
        },
      });
    } catch {
      // Legacy mirror remains best-effort for existing watchlist status features.
    }

    await recordWatchlistActivity({
      watchlistId: ownedList.id,
      actorId: me.id,
      type: "ITEM_ADDED",
      movieId: movie.id,
      metadata: {
        createdFrom: "lists-api",
        mirroredToDefaultWatchlistId: defaultWatchlist.id,
      },
    });

    return NextResponse.json(
      {
        movie: mapListMovie(movie),
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST /api/lists/[id]/movies error", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
