import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import {
  DEFAULT_WATCHLIST_SLUG,
  LEGACY_DEFAULT_WATCHLIST_SLUG,
  getCurrentUserOrNull,
} from "@/app/libs/watchlists";
import { listSummaryInclude, mapListSummary } from "@/app/libs/lists";

export const maxDuration = 30;
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    const me = await getCurrentUserOrNull();
    if (!me) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const lists = await prisma.watchlist.findMany({
      where: {
        ownerId: me.id,
        isSystemDefault: { not: true },
        slug: { notIn: [DEFAULT_WATCHLIST_SLUG, LEGACY_DEFAULT_WATCHLIST_SLUG] },
      },
      orderBy: [{ updatedAt: "desc" }, { createdAt: "desc" }],
      include: listSummaryInclude,
    });

    return NextResponse.json({
      lists: lists.map((list) => mapListSummary(list, me.id)),
    });
  } catch (error) {
    console.error("GET /api/lists/my error", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
