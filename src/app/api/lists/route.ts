import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import {
  buildUniqueWatchlistSlug,
  getCurrentUserOrNull,
  recordWatchlistActivity,
} from "@/app/libs/watchlists";
import { listSummaryInclude, mapListSummary } from "@/app/libs/lists";

export const maxDuration = 30;
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function POST(req: NextRequest) {
  try {
    const me = await getCurrentUserOrNull();
    if (!me) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const rawTitle =
      typeof body?.title === "string"
        ? body.title
        : typeof body?.name === "string"
          ? body.name
          : "";
    const title = rawTitle.trim().slice(0, 60);
    const description =
      typeof body?.description === "string" && body.description.trim()
        ? body.description.trim().slice(0, 280)
        : null;
    const isPublic = Boolean(body?.isPublic);

    if (!title || title.length < 2) {
      return NextResponse.json(
        { error: "List title must be at least 2 characters." },
        { status: 400 }
      );
    }

    const slug = await buildUniqueWatchlistSlug(me.id, title);
    const created = await prisma.$transaction(async (tx) => {
      const list = await tx.watchlist.create({
        data: {
          ownerId: me.id,
          name: title,
          description,
          slug,
          isPublic,
          visibility: (isPublic ? "SHARED" : "PRIVATE") as any,
          isSystemDefault: false,
          shareToken: crypto.randomUUID(),
        },
      });

      await tx.watchlistMember.upsert({
        where: {
          watchlistId_userId: {
            watchlistId: list.id,
            userId: me.id,
          },
        },
        update: {
          role: "OWNER" as any,
          status: "ACTIVE" as any,
          joinedAt: new Date(),
        },
        create: {
          watchlistId: list.id,
          userId: me.id,
          role: "OWNER" as any,
          status: "ACTIVE" as any,
          joinedAt: new Date(),
        },
      });

      return tx.watchlist.findUnique({
        where: { id: list.id },
        include: listSummaryInclude,
      });
    });

    if (!created) {
      return NextResponse.json({ error: "Failed to create list." }, { status: 500 });
    }

    await recordWatchlistActivity({
      watchlistId: created.id,
      actorId: me.id,
      type: "WATCHLIST_CREATED",
      metadata: { createdFrom: "lists-api", isPublic },
    });

    return NextResponse.json(
      { list: mapListSummary(created, me.id) },
      { status: 201 }
    );
  } catch (error: any) {
    const maybeCode = error?.code;
    if (maybeCode === "P2002") {
      return NextResponse.json(
        { error: "A list with that title already exists." },
        { status: 409 }
      );
    }

    console.error("POST /api/lists error", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
