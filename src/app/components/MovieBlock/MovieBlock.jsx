// app/components/MovieBlock/MovieBlock.jsx
"use client";
import { useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { FaImdb } from "react-icons/fa";
import { MdAccessTime, MdFavorite, MdLiveTv, MdOutlineTheaters, MdStar } from "react-icons/md";
import { SiAppletv, SiNetflix, SiPrimevideo, SiYoutube, SiRottentomatoes } from "react-icons/si";
import { getGsap } from "@/app/libs/gsapClient";
import { showToast } from "@/app/components/ui/toast";
import { getLikedChannel } from "@/app/libs/likedBus";
import AddToWatchlistControl from "@/app/components/Watchlists/AddToWatchlistControlRevamp";
import { setLikedStatusCache, useLikedStatus } from "@/lib/liked-status-client";

function isAbsoluteUrl(value) {
  return typeof value === "string" && /^(https?:)?\/\//.test(value);
}

function getPosterSource(item) {
  const rawPoster = item?.posterUrl || item?.poster_path || item?.posterPath;
  if (!rawPoster) return "/img/logo.png";
  if (isAbsoluteUrl(rawPoster)) return rawPoster;
  return `https://image.tmdb.org/t/p/w500${rawPoster}`;
}

function getReleaseYear(item) {
  const rawDate = item?.release_date || item?.releaseDate;
  if (!rawDate) return null;
  const year = String(rawDate).split("-")[0];
  return year && year !== "undefined" ? year : null;
}

function isNewInTheaters(releaseDate) {
  if (!releaseDate) return false;
  const parsed = new Date(releaseDate);
  if (Number.isNaN(parsed.getTime())) return false;
  const daysSinceRelease = (Date.now() - parsed.getTime()) / (1000 * 60 * 60 * 24);
  return daysSinceRelease >= 0 && daysSinceRelease <= 45;
}

function formatRuntime(runtime) {
  const totalMinutes = Number(runtime);
  if (!Number.isFinite(totalMinutes) || totalMinutes <= 0) return null;
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (!hours) return `${minutes}m`;
  if (!minutes) return `${hours}h`;
  return `${hours}h ${minutes}m`;
}

function providerIcon(providerName = "") {
  const normalized = providerName.toLowerCase();
  if (normalized.includes("netflix")) return <SiNetflix />;
  if (normalized.includes("amazon") || normalized.includes("prime video") || normalized.includes("primevideo")) {
    return <SiPrimevideo />;
  }
  if (normalized.includes("apple tv")) return <SiAppletv />;
  if (normalized.includes("youtube")) return <SiYoutube />;
  return <MdLiveTv />;
}

export default function MovieBlock({ 
  item, 
  index, 
  defaultLiked = false,
  enhanced = false,
}) {
  const [isLiked, setIsLiked] = useLikedStatus(item?.id, !!defaultLiked);

  const cardRef = useRef(null);
  const tapeRef = useRef(null);
  const likeButtonRef = useRef(null);
  const posterRef = useRef(null);
  const releaseYear = getReleaseYear(item);
  const runtimeLabel = formatRuntime(item?.runtime);
  const certification = typeof item?.certification === "string" ? item.certification.trim() : "";
  const inTheaters = !!item?.inTheaters || isNewInTheaters(item?.release_date || item?.releaseDate);
  const visibleProviders = Array.isArray(item?.providers) ? item.providers.slice(0, 4) : [];
  const hasReviewScores = typeof item?.imdbRating === "number" || !!item?.rottenTomatoes;
  const hasExpandedInfo =
    enhanced &&
    (Boolean(item?.overview) || hasReviewScores || Boolean(runtimeLabel) || Boolean(certification) || visibleProviders.length > 0);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      const card = cardRef.current;
      const gsap = await getGsap();
      if (cancelled || !card || !gsap) return;

      gsap.fromTo(
        card,
        { opacity: 0, y: 24, scale: 0.96 },
        { opacity: 1, y: 0, scale: 1, duration: 0.35, delay: index * 0.02, ease: "power2.out" }
      );
    })();

    return () => {
      cancelled = true;
    };
  }, [index]);

  const createFlyingPosterAnimation = (gsap, startX, startY, posterUrl, posterWidth, posterHeight) => {
    const flyingPoster = document.createElement("div");
    Object.assign(flyingPoster.style, {
      position: "fixed",
      left: `${startX}px`,
      top: `${startY}px`,
      width: `${posterWidth}px`,
      height: `${posterHeight}px`,
      zIndex: "2147483647",
      pointerEvents: "none",
      borderRadius: "8px",
      overflow: "hidden",
      boxShadow: "0 10px 30px rgba(0,0,0,0.5)",
      opacity: "1",
    });

    const flyingImage = document.createElement("img");
    flyingImage.src = posterUrl;
    Object.assign(flyingImage.style, {
      width: "100%",
      height: "100%",
      objectFit: "cover",
      borderRadius: "8px",
    });

    flyingPoster.appendChild(flyingImage);
    document.body.appendChild(flyingPoster);

    const targetX = 28,
      targetY = 20;

    gsap.to(flyingPoster, {
      x: targetX - startX,
      y: targetY - startY,
      scale: 0.18,
      rotation: 120,
      duration: 0.5, // faster
      ease: "power2.in",
      onComplete: () => {
        document.body.removeChild(flyingPoster);
      },
    });
  };

  async function addToLiked() {
    const res = await fetch("/api/liked/add", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        movieId: String(item.id),
        title: item.title || item.original_title,
        posterUrl: getPosterSource(item) === "/img/logo.png" ? null : getPosterSource(item),
      }),
    });
    if (!res.ok) throw new Error("add failed");
  }

  async function removeFromLiked() {
    const res = await fetch("/api/liked/remove", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ movieId: String(item.id) }),
    });
    if (!res.ok) throw new Error("remove failed");
  }

  const handleLike = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    const likeButton = likeButtonRef.current;
    const poster = posterRef.current;
    const previousLiked = isLiked;
    const nextLiked = !isLiked;

    try {
      const gsap = await getGsap();
      setIsLiked(nextLiked);
      setLikedStatusCache(item.id, nextLiked);

      if (!isLiked) {
        if (gsap && likeButton) {
          gsap.fromTo(likeButton, { scale: 1 }, { scale: 1.18, duration: 0.12, yoyo: true, repeat: 1 });
        }

        await addToLiked();

        if (gsap && poster) {
          const rect = poster.getBoundingClientRect();
          createFlyingPosterAnimation(
            gsap,
            rect.left + rect.width / 2,
            rect.top + rect.height / 2,
            getPosterSource(item),
            rect.width,
            rect.height
          );
        }

        // Broadcast to everyone (Liked page listens)
        getLikedChannel().postMessage({
          type: "LIKED_ADD",
          payload: {
            tmdbId: String(item.id),
            title: item.title,
            posterUrl: getPosterSource(item) === "/img/logo.png" ? null : getPosterSource(item),
          },
        });

        showToast("Added to Liked ❤️");
      } else {
        if (gsap && likeButton) {
          gsap.fromTo(likeButton, { scale: 1 }, { scale: 0.92, duration: 0.12, yoyo: true, repeat: 1 });
        }

        await removeFromLiked();

        getLikedChannel().postMessage({
          type: "LIKED_REMOVE",
          payload: { tmdbId: String(item.id) },
        });

        showToast("Removed from Liked");
      }
    } catch {
      setIsLiked(previousLiked);
      setLikedStatusCache(item.id, previousLiked);
      showToast("Something went wrong", 1400);
    }
  };

  const handleHover = async () => {
    const gsap = await getGsap();
    if (!gsap) return;
    const tl = gsap.timeline();
    tl.to(cardRef.current, { y: -6, duration: 0.18, ease: "power2.out" })
      .to(cardRef.current, { rotation: 0.6, duration: 0.08 })
      .to(cardRef.current, { rotation: 0, duration: 0.08 });
    gsap.to(tapeRef.current, { rotation: 2, y: -2, duration: 0.12, yoyo: true, repeat: 1 });
  };

  const handleHoverExit = async () => {
    const gsap = await getGsap();
    if (!gsap) return;
    gsap.to(cardRef.current, { y: 0, rotation: 0, duration: 0.25, ease: "power2.out" });
    gsap.to(tapeRef.current, { rotation: 0, y: 0, duration: 0.2 });
  };

  const handleTap = async () => {
    const gsap = await getGsap();
    if (!gsap) return;
    const tl = gsap.timeline();
    tl.to(cardRef.current, { scale: 0.97, duration: 0.08 }).to(cardRef.current, { scale: 1, duration: 0.2, ease: "power2.out" });
  };

  return (
    <Link href={`/movies/${item.id}`} className="group block">
      <div
        ref={cardRef}
        className={`relative cursor-pointer border-2 bg-white p-4 shadow-2xl transition-all duration-300 ${
          enhanced
            ? "border-[#f0d8a6] hover:shadow-[0_28px_55px_rgba(0,0,0,0.28)]"
            : "border-white hover:shadow-3xl"
        }`}
        onMouseEnter={handleHover}
        onMouseLeave={handleHoverExit}
        onTouchStart={handleTap}
      >
        <div ref={tapeRef} className="absolute -top-8 left-1/2 -translate-x-1/2 z-20 pointer-events-none">
          <Image src="/img/tape.png" alt="" width={104} height={44} className="w-[5rem] h-[3.3rem] object-contain drop-shadow-lg" />
        </div>

        <div className="absolute inset-0 border-8 border-white pointer-events-none" />

        <div className="aspect-[3/4] overflow-hidden mb-4 bg-gradient-to-br from-yellow-400 to-yellow-600 relative">
          <div ref={posterRef}>
            <Image
              src={getPosterSource(item)}
              alt={item.title || "Movie poster"}
              width={200}
              height={300}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 ease-out"
            />
          </div>

          <div className="absolute left-2 top-2 z-20 flex items-center gap-1 border border-white/20 bg-black/90 px-2 py-1 text-xs font-bold text-white">
            <MdStar className="text-yellow-400" size={12} />
            {(item.vote_average ?? 0).toFixed(1)}
          </div>

          {inTheaters ? (
            <div className="absolute bottom-2 left-2 z-20 inline-flex items-center gap-1 rounded-full border border-emerald-300/45 bg-emerald-500/20 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-white">
              <MdOutlineTheaters size={12} />
              In theaters
            </div>
          ) : null}

          {hasExpandedInfo ? (
            <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 translate-y-3 bg-gradient-to-t from-black via-black/95 to-transparent px-3 pb-3 pt-12 opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
              <div className="space-y-2.5">
                {item?.overview ? (
                  <p className="line-clamp-3 text-[11px] leading-4 text-white/90">
                    {item.overview}
                  </p>
                ) : null}

                {hasReviewScores ? (
                  <div className="flex flex-wrap gap-1.5">
                    {typeof item?.imdbRating === "number" ? (
                      <span className="inline-flex items-center gap-1 rounded-full border border-yellow-400/30 bg-yellow-500/15 px-2 py-1 text-[10px] font-semibold text-yellow-100">
                        <FaImdb className="text-yellow-400" />
                        IMDb {item.imdbRating.toFixed(1)}
                      </span>
                    ) : null}
                    {item?.rottenTomatoes ? (
                      <span className="inline-flex items-center gap-1 rounded-full border border-red-400/30 bg-red-500/15 px-2 py-1 text-[10px] font-semibold text-red-100">
                        <SiRottentomatoes className="text-red-400" />
                        RT {item.rottenTomatoes}
                      </span>
                    ) : null}
                  </div>
                ) : null}

                {visibleProviders.length > 0 ? (
                  <div className="flex items-center gap-1.5 text-sm text-white/85">
                    {visibleProviders.map((provider) => (
                      <span
                        key={provider.provider_id || provider.provider_name}
                        className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-white/15 bg-white/10"
                        title={provider.provider_name}
                      >
                        {providerIcon(provider.provider_name)}
                      </span>
                    ))}
                  </div>
                ) : null}
              </div>
            </div>
          ) : null}

          <div className="absolute top-2 right-2 z-20 flex flex-col gap-2">
            <button
              ref={likeButtonRef}
              onClick={handleLike}
              className={`p-2 rounded-full shadow-lg transition-all duration-200 transform hover:scale-110 border border-white/30 ${
                isLiked ? "bg-red-500 text-white" : "bg-white/95 text-gray-800 hover:bg-red-500 hover:text-white"
              }`}
              aria-label={isLiked ? "Unlike" : "Like"}
            >
              <MdFavorite size={16} />
            </button>

            <AddToWatchlistControl
              compact
              movie={{
                id: item.id,
                title: item.title || item.original_title,
                poster_path: item.poster_path,
                posterUrl: item.posterUrl || null,
                release_date: item.release_date || item.releaseDate || null,
              }}
            />
          </div>
        </div>

        <div className="space-y-2.5 px-1 text-center">
          <h3
            className="font-bold text-gray-900 text-sm leading-tight min-h-[1.25rem] truncate tracking-tight"
            title={item.title}
          >
            {item.title}
          </h3>
          <div className="flex flex-wrap items-center justify-center gap-1.5 text-[11px] font-medium text-gray-700">
            {releaseYear ? (
              <span className="rounded-full border border-gray-200 bg-gray-100 px-2 py-1">
                {releaseYear}
              </span>
            ) : null}
            {runtimeLabel ? (
              <span className="inline-flex items-center gap-1 rounded-full border border-gray-200 bg-gray-100 px-2 py-1">
                <MdAccessTime size={12} />
                {runtimeLabel}
              </span>
            ) : null}
            {certification ? (
              <span className="rounded-full border border-amber-200 bg-amber-50 px-2 py-1 font-semibold text-amber-800">
                {certification}
              </span>
            ) : null}
          </div>

          {enhanced && hasReviewScores ? (
            <div className="flex flex-wrap items-center justify-center gap-1.5 text-[11px] font-semibold">
              {typeof item?.imdbRating === "number" ? (
                <span className="inline-flex items-center gap-1 rounded-full border border-yellow-200 bg-yellow-50 px-2 py-1 text-yellow-800">
                  <FaImdb className="text-yellow-500" />
                  {item.imdbRating.toFixed(1)}
                </span>
              ) : null}
              {item?.rottenTomatoes ? (
                <span className="inline-flex items-center gap-1 rounded-full border border-red-200 bg-red-50 px-2 py-1 text-red-700">
                  <SiRottentomatoes className="text-red-500" />
                  {item.rottenTomatoes}
                </span>
              ) : null}
            </div>
          ) : null}

          {enhanced && visibleProviders.length > 0 ? (
            <div className="flex items-center justify-center gap-1.5 text-sm text-gray-600">
              {visibleProviders.map((provider) => (
                <span
                  key={`provider-inline-${provider.provider_id || provider.provider_name}`}
                  className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-gray-200 bg-white"
                  title={provider.provider_name}
                >
                  {providerIcon(provider.provider_name)}
                </span>
              ))}
            </div>
          ) : null}
        </div>

        <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-4/5 h-2 bg-black/15 blur-sm rounded-full group-hover:bg-black/25 transition-all duration-300" />
      </div>
    </Link>
  );
}
