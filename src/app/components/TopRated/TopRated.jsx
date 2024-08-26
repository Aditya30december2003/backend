"use client"
import React, { useEffect, useState } from 'react';
import requests from '@/app/helpers/Requests';
import MovieBlock from '../MovieBlock/MovieBlock';
import Image from 'next/image';
const genresList = [
    { id: 28, name: 'Action' },
    { id: 12, name: 'Adventure' },
    { id: 16, name: 'Animation' },
    { id: 35, name: 'Comedy' },
    { id: 80, name: 'Crime' },
    { id: 99, name: 'Documentary' },
    { id: 18, name: 'Drama' },
    { id: 10751, name: 'Family' },
    { id: 14, name: 'Fantasy' },
    { id: 36, name: 'History' },
    { id: 27, name: 'Horror' },
    { id: 10402, name: 'Music' },
    { id: 9648, name: 'Mystery' },
    { id: 10749, name: 'Romance' },
    { id: 878, name: 'Science Fiction' },
    { id: 53, name: 'Thriller' },
    { id: 10770, name: 'TV Movie' },
    { id: 10752, name: 'War' },
    { id: 37, name: 'Western' },
];

const TopRated = () => {
    const [items, setItems] = useState([]);
    const [page, setPage] = useState(1);
    const [selectedGenres, setSelectedGenres] = useState([]);

    const fetchData = async () => {
        let allItems = [];
        let page = 1;
        while (allItems.length <= 100) {
            const request = await fetch(`${requests.requestTopRated}&page=${page}`);
            const data = await request.json();
            allItems = [...allItems, ...data.results];
            page++;
        }
        setItems(allItems.slice(0, 100)); // Make sure to limit to 100 movies
    };

    useEffect(() => {
        fetchData();
    }, []);

    const MoviesPerPage = 20;
    let AllPages = [];
    const totalPages = Math.ceil(items.length / MoviesPerPage);
    for (let i = 0; i < totalPages; i++) {
        AllPages.push(i + 1);
    }

    let firstIndex = (page - 1) * MoviesPerPage;
    let lastIndex = page * MoviesPerPage;

    // Filter items based on selected genres
    const filteredItems = selectedGenres.length > 0
        ? items.filter(item =>
            item.genre_ids.some(genre => selectedGenres.includes(genre))
        )
        : items;

    let currentItems = filteredItems.slice(firstIndex, lastIndex);

    if (items.length === 0)
        return (
            <div className='text-center'>
                <Image width={100} height={100} src='./img/NoImage' alt="No Image" />
                <p className=''>No Movies Available</p>
            </div>
        );

    const handleGenreSelect = (genreId) => {
        setSelectedGenres(prev =>
            prev.includes(genreId)
                ? prev.filter(id => id !== genreId)
                : [...prev, genreId]
        );
    };

    return (
        <div>
            <h1 className='font-bold text-center'>Top Rated</h1>

            {/* Genre Filters */}
            <div className='flex flex-wrap gap-2 justify-center mb-5'>
                {genresList.map((genre) => (
                    <button
                        key={genre.id}
                        className={`px-4 py-2 border-2 ${selectedGenres.includes(genre.id) ? 'bg-white text-black' : ''} cursor-pointer`}
                        onClick={() => handleGenreSelect(genre.id)}
                    >
                        {genre.name}
                    </button>
                ))}
            </div>

            {/* Movies Grid */}
            <div className='grid grid-cols-5 mx-auto w-[80%] gap-5'>
                {currentItems.map((item, index) => (
                    <MovieBlock item={item} key={index} />
                ))}
            </div>

            {/* Pagination */}
            <div className='flex items-center font-bold  mx-auto w-[25%] mb-10 mt-10 gap-5'>
                {AllPages.map((item) => (
                    <div
                        key={item}
                        onClick={() => setPage(item)}
                        className='border-2  px-4 py-3 cursor-pointer'
                    >
                        {item}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default TopRated;


