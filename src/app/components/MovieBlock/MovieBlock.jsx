"use client"
import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
const MovieBlock = ({ item }) => {
    const [hover, setHover] = useState(false);

    const addToWatchlist = async () => {
        const response = await fetch('/api/watchlist/add', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                movieId: item.id.toString(),
                title: item.title,
                posterUrl: item.poster_path
                    ? `https://image.tmdb.org/t/p/original${item.poster_path}`
                    : null,
            }),
        });

        if (response.ok) {
            alert("Movie added to your watchlist!");
        } else {
            alert("Failed to add movie to watchlist.");
        }
    };

    const addToLikedlist = async () => {
        const response = await fetch('/api/liked/add', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                movieId: item.id.toString(),
                title: item.title,
                posterUrl: item.poster_path
                    ? `https://image.tmdb.org/t/p/original${item.poster_path}`
                    : null,
            }),
        });

        if (response.ok) {
            alert("Movie added to your liked list!");
        } else {
            alert("Failed to add movie to liked list.");
        }
    };
    return (
        <div 
            className="relative"
            onMouseEnter={() => setHover(true)}
            onMouseLeave={() => setHover(false)}
        >
            <Link
                href={`/movies/${item.id}`}
                className='cursor-pointer hover:border-2 duration-500 hover:border-orange-600'
            >
                <div className='relative h-[18rem] w-[12rem]'>
                    {item.poster_path ? (
                        <Image
                            width={100}
                            height={100}
                            className='absolute inset-0 h-full w-full object-cover'
                            src={`https://image.tmdb.org/t/p/original${item.poster_path}`}
                            alt={item.title || "Movie Image"}
                        />
                    ) : (
                        <Image
                            className='absolute inset-0 h-full w-full object-cover'
                            src='./img/NoImage'
                            alt="No image available"
                            width={100}
                            height={100}
                        />
                    )}
                    
                    {hover && (
                        <div className="absolute inset-0 bg-black bg-opacity-70 flex items-end justify-between p-2">
                            {/* <h3 className="bg-transparent text-white text-center font-bold">{item.title}</h3> */}
                            <button  onClick={(e) => {
                                    e.preventDefault(); // Prevent the Link click
                                    addToWatchlist();
                                }} className="bg-transparent hover:text-blue-500 text-white text-center font-bold">Add to Watch</button>
                            <button onClick={(e) => {
                                    e.preventDefault(); // Prevent the Link click
                                    addToLikedlist();
                                }} className="text-red-500 bg-transparent text-center font-bold">Like</button>
                        </div>
                    )}
                </div>
            </Link>
        </div>
    );
};

export default MovieBlock;