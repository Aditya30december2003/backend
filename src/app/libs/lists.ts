import prisma from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import {
  DEFAULT_WATCHLIST_SLUG,
  LEGACY_DEFAULT_WATCHLIST_SLUG,
  ensureOwnerMembership,
} from "@/app/libs/watchlists";

export function isDefaultListLike(input: { slug?: string | null; isSystemDefault?: boolean | null }) {
  return (
    Boolean(input?.isSystemDefault) ||
    input?.slug === DEFAULT_WATCHLIST_SLUG ||
    input?.slug === LEGACY_DEFAULT_WATCHLIST_SLUG
  );
}

export const listSummaryInclude: Prisma.WatchlistInclude = {
  owner: {
    select: {
      id: true,
      username: true,
      name: true,
      avatarUrl: true,
      image: true,
    },
  },
  _count: {
    select: {
      items: true,
    },
  },
  items: {
    take: 4,
    orderBy: [{ rank: "asc" }, { addedAt: "asc" }],
    select: {
      movie: {
        select: {
          id: true,
          tmdbId: true,
          title: true,
          posterUrl: true,
          releaseDate: true,
        },
      },
    },
  },
};

export const listDetailInclude: Prisma.WatchlistInclude = {
  owner: {
    select: {
      id: true,
      username: true,
      name: true,
      avatarUrl: true,
      image: true,
    },
  },
  _count: {
    select: {
      items: true,
    },
  },
  items: {
    orderBy: [{ rank: "asc" }, { addedAt: "asc" }],
    select: {
      id: true,
      addedAt: true,
      updatedAt: true,
      movie: {
        select: {
          id: true,
          tmdbId: true,
          title: true,
          posterUrl: true,
          releaseDate: true,
        },
      },
    },
  },
};

export function mapListMovie(movie: any) {
  return {
    id: movie?.id,
    movieId: movie?.tmdbId || movie?.id || null,
    tmdbId: movie?.tmdbId || null,
    title: movie?.title || "Untitled movie",
    posterPath: movie?.posterUrl ?? null,
    posterUrl: movie?.posterUrl ?? null,
    releaseDate: movie?.releaseDate ?? null,
  };
}

export function mapListSummary(list: any, currentUserId?: string | null) {
  const items = Array.isArray(list?.items) ? list.items : [];

  return {
    id: list.id,
    title: list.name,
    description: list.description ?? null,
    isPublic: Boolean(list.isPublic),
    userId: list.ownerId,
    createdAt: list.createdAt,
    updatedAt: list.updatedAt,
    movieCount:
      typeof list?._count?.items === "number"
        ? list._count.items
        : items.length,
    owner:
      list.owner
        ? {
            id: list.owner.id,
            username: list.owner.username ?? null,
            name: list.owner.name ?? null,
            avatarUrl: list.owner.avatarUrl ?? null,
            image: list.owner.image ?? null,
          }
        : null,
    isOwner: currentUserId ? list.ownerId === currentUserId : false,
    movies: items
      .map((item: any) => mapListMovie(item?.movie))
      .filter((movie: any) => movie.movieId),
  };
}

export function mapListDetail(list: any, currentUserId?: string | null) {
  const base = mapListSummary(list, currentUserId);
  const items = Array.isArray(list?.items) ? list.items : [];

  return {
    ...base,
    movies: items
      .map((item: any) => ({
        listItemId: item?.id,
        addedAt: item?.addedAt ?? null,
        updatedAt: item?.updatedAt ?? null,
        ...mapListMovie(item?.movie),
      }))
      .filter((movie: any) => movie.movieId),
  };
}

export async function getAccessibleList(listId: string, currentUserId?: string | null) {
  const list = await prisma.watchlist.findUnique({
    where: { id: listId },
    select: {
      id: true,
      ownerId: true,
      isPublic: true,
      isSystemDefault: true,
      slug: true,
    },
  });

  if (!list || isDefaultListLike(list)) return null;

  await ensureOwnerMembership(list.id, list.ownerId);

  const isOwner = Boolean(currentUserId && list.ownerId === currentUserId);
  if (!isOwner && !list.isPublic) return null;

  return { list, isOwner };
}
