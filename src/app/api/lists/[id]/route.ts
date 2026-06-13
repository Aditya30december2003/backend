import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import {
  buildUniqueWatchlistSlug,
  getCurrentUserOrNull,
  recordWatchlistActivity,
} from "@/app/libs/watchlists";
import {
  getAccessibleList,
  isDefaultListLike,
  listDetailInclude,
  listSummaryInclude,
  mapListDetail,
  mapListSummary,
} from "@/app/libs/lists";

export const maxDuration = 30;
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const me = await getCurrentUserOrNull();
    const access = await getAccessibleList(params.id, me?.id);

    if (!access) {
      return NextResponse.json({ error: "List not found" }, { status: 404 });
    }

    const list = await prisma.watchlist.findUnique({
      where: { id: params.id },
      include: listDetailInclude,
    });

    if (!list) {
      return NextResponse.json({ error: "List not found" }, { status: 404 });
    }

    return NextResponse.json({
      list: {
        ...mapListDetail(list, me?.id),
        canEdit: access.isOwner,
        canDelete: access.isOwner,
      },
    });
  } catch (error) {
    console.error("GET /api/lists/[id] error", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(
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
    const patch: Record<string, unknown> = {};

    if (typeof body?.title === "string" || typeof body?.name === "string") {
      const nextTitle = String(body?.title ?? body?.name ?? "").trim().slice(0, 60);
      if (!nextTitle || nextTitle.length < 2) {
        return NextResponse.json(
          { error: "List title must be at least 2 characters." },
          { status: 400 }
        );
      }
      patch.name = nextTitle;
      patch.slug = await buildUniqueWatchlistSlug(ownedList.ownerId, nextTitle);
    }

    if (typeof body?.description === "string" || body?.description === null) {
      patch.description =
        typeof body.description === "string" && body.description.trim()
          ? body.description.trim().slice(0, 280)
          : null;
    }

    if (typeof body?.isPublic === "boolean") {
      patch.isPublic = body.isPublic;
      patch.visibility = (body.isPublic ? "SHARED" : "PRIVATE") as any;
    }

    if (!Object.keys(patch).length) {
      return NextResponse.json(
        { error: "No valid updates provided." },
        { status: 400 }
      );
    }

    const updated = await prisma.watchlist.update({
      where: { id: ownedList.id },
      data: patch,
      include: listSummaryInclude,
    });

    await recordWatchlistActivity({
      watchlistId: ownedList.id,
      actorId: me.id,
      type: "WATCHLIST_UPDATED",
      metadata: { updatedFrom: "lists-api" },
    });

    return NextResponse.json({
      list: mapListSummary(updated, me.id),
    });
  } catch (error: any) {
    const maybeCode = error?.code;
    if (maybeCode === "P2002") {
      return NextResponse.json(
        { error: "A list with that title already exists." },
        { status: 409 }
      );
    }

    console.error("PATCH /api/lists/[id] error", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
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

    await prisma.watchlist.delete({
      where: { id: ownedList.id },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("DELETE /api/lists/[id] error", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
