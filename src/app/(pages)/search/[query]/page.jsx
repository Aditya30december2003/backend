"use client"
import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import MovieBlock from '@/app/components/MovieBlock/MovieBlock'

const SearchedItems = () => {
    const { query } = useParams();
    const [items, setItems] = useState([]);

    const searchMovie = async () => {
        try {
            const response = await fetch(`https://api.themoviedb.org/3/search/movie?api_key=${process.env.NEXT_PUBLIC_API_KEY}&query=${query}`);
            if (!response.ok) {
                console.log("Error fetching data");
                return;
            }
            const data = await response.json();
            // Filter out movies without a backdrop_path
            const filteredItems = data.results.filter(item => item.backdrop_path);
            setItems(filteredItems);
        } catch (error) {
            console.error("Error:", error);
            alert("An error occurred while fetching data.");
        }
    };

    useEffect(() => {
        searchMovie();
    }, [query]);

    return (
        <div>
            <h1>There are {items.length} results for {query}</h1>
            <div className='flex flex-col gap-4 p-3'>
                {items.map((item , index) => (
                    <div key={item.id} className='flex items-center gap-3'>
                        <MovieBlock item={item} key={index}/>
                        <div className='flex flex-col gap-1'>
                            <h1 className='text-lg font-bold'>{item.original_title}</h1>
                            <p className='text-sm'>{item.overview}</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default SearchedItems;
