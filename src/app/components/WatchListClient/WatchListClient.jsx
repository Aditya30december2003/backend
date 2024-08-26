"use client";
import { useState } from "react";
import Image from "next/image";
import Link from "next/link";

export default function WatchlistClient({ initialWatchlist = [] }) {
    const [watchlist, setWatchlist] = useState(initialWatchlist);

    async function removeFromWatchlist(movieId) {
        try {
            const response = await fetch('/api/watchlist/remove', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ movieId }),
            });

            if (response.ok) {
                setWatchlist(watchlist.filter(item => item.movieId !== movieId));
                console.log("Movie removed from watchlist");
            } else {
                console.error("Failed to remove movie from watchlist");
            }
        } catch (error) {
            console.error("Error:", error);
        }
    }

    return (
        <div>
            <h1 className="text-white text-2xl mb-4">Your Watchlist</h1>
            <p>You have {watchlist.length} movies to watch!!!</p>
            <div className="grid grid-cols-5 gap-2 p-5">
                {watchlist.length > 0 ? (
                    watchlist.map((item) => (
                        <div key={item.id} className="relative">
                            <Link href={`/movies/${item.movie.tmdbId}`}>
                                <div className="relative h-[18rem] w-[12rem]">
                                    <Image
                                        width={100}
                                        height={100}
                                        className="absolute inset-0 h-full w-full object-cover"
                                        src={item.movie.posterUrl}
                                        alt={item.movie.title || "Movie Image"}
                                    />
                                    <div className="absolute inset-0 hover:bg-black hover:bg-opacity-50 flex items-end justify-center p-2">
                                        <button 
                                           onClick={(e) => {
                                            e.preventDefault(); // Prevent navigation
                                            removeFromWatchlist(item.movieId);
                                        }} 
                                            className="bg-red-500 text-white px-2 py-1">
                                            Remove From WatchList
                                        </button>
                                    </div>
                                </div>
                            </Link>
                        </div>
                    ))
                ) : (
                    <p className="text-white">Your watchlist is empty.</p>
                )}
            </div>
        </div>
    );
}
