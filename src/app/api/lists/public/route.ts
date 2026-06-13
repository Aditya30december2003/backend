import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import {
  DEFAULT_WATCHLIST_SLUG,
  LEGACY_DEFAULT_WATCHLIST_SLUG,
} from "@/app/libs/watchlists";
import { listSummaryInclude, mapListSummary } from "@/app/libs/lists";

export const maxDuration = 30;
export const dynamic = "force-dynamic";
export const revalidate = 0;

function parseLimit(rawValue: string | null) {
  const parsed = Number(rawValue ?? 24);
  if (!Number.isFinite(parsed) || parsed <= 0) return 24;
  return Math.min(Math.floor(parsed), 60);
}

export async function GET(req: NextRequest) {
  try {
    const userId = req.nextUrl.searchParams.get("userId")?.trim() || undefined;
    const limit = parseLimit(req.nextUrl.searchParams.get("limit"));

    const lists = await prisma.watchlist.findMany({
      where: {
        isPublic: true,
        isSystemDefault: { not: true },
        slug: { notIn: [DEFAULT_WATCHLIST_SLUG, LEGACY_DEFAULT_WATCHLIST_SLUG] },
        ...(userId ? { ownerId: userId } : {}),
      },
      orderBy: [{ updatedAt: "desc" }, { createdAt: "desc" }],
      take: limit,
      include: listSummaryInclude,
    });

    return NextResponse.json({
      lists: lists.map((list) => mapListSummary(list)),
    });
  } catch (error) {
    console.error("GET /api/lists/public error", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
