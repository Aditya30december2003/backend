import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { isDefaultListLike } from "@/app/libs/lists";
import {
  findMovieByRouteParam,
  getCurrentUserOrNull,
  recordWatchlistActivity,
} from "@/app/libs/watchlists";

export const maxDuration = 30;
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string; movieId: string } }
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

    const movie = await findMovieByRouteParam(params.movieId);
    if (!movie) {
      return NextResponse.json({ ok: true, deleted: 0 });
    }

    const deleted = await prisma.watchlistItem.deleteMany({
      where: {
        watchlistId: ownedList.id,
        movieId: movie.id,
      },
    });

    if (deleted.count > 0) {
      await recordWatchlistActivity({
        watchlistId: ownedList.id,
        actorId: me.id,
        type: "ITEM_REMOVED",
        movieId: movie.id,
        metadata: { removedFrom: "lists-api" },
      });
    }

    return NextResponse.json({ ok: true, deleted: deleted.count });
  } catch (error) {
    console.error("DELETE /api/lists/[id]/movies/[movieId] error", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
