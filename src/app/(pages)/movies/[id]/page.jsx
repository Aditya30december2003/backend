"use client"
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Image from 'next/image';

const Info = () => {
    const [item, setItem] = useState({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const params = useParams();
    const movieId = params.id; // Get the movieId from the route parameters

    useEffect(() => {
        const getData = async () => {
            try {
                if (!movieId) return; // Ensure movieId is available
                const [movieResponse, creditsResponse] = await Promise.all([
                    fetch(`https://api.themoviedb.org/3/movie/${movieId}?api_key=${process.env.NEXT_PUBLIC_API_KEY}`),
                    fetch(`https://api.themoviedb.org/3/movie/${movieId}/credits?api_key=${process.env.NEXT_PUBLIC_API_KEY}`)
                ]);

                if (!movieResponse.ok || !creditsResponse.ok) {
                    throw new Error('Network response was not ok');
                }

                const [movieData, creditsData] = await Promise.all([
                    movieResponse.json(),
                    creditsResponse.json()
                ]);

                setItem({...movieData, credits: creditsData});
            } catch (error) {
                setError(error.message);
            } finally {
                setLoading(false);
            }
        };

        getData();
    }, [movieId]);

    const getDirector = (crew) => {
        return crew.find(member => member.job === "Director")?.name || "Unknown";
    };

    const getWriters = (crew) => {
        return crew.filter(member => member.department === "Writing")
                   .map(writer => writer.name)
                   .join(", ") || "Unknown";
    };

    const getCast = (cast, limit = 5) => {
        return cast.slice(0, limit).map(actor => actor.name).join(", ");
    };

    const getProductionCompanies = (companies) => {
        return companies.map(company => company.name).join(", ");
    };

    if (loading) {
        return <p className="text-center">Loading...</p>;
    }

    if (error) {
        return <p className="text-center text-red-500">Error: {error}</p>;
    }

    return (
        <div>
            <div className='h-full w-full relative'>
                <div className="absolute bg-black/30 top-0 left-0 w-full h-[30rem] text-white font-bold"></div>   
                <Image
                    className='inset-0 h-[30rem] w-full object-cover object-top'
                    src={`https://image.tmdb.org/t/p/original${item.backdrop_path}`}
                    alt={item.title || "Movie Image"}
                    width={240}
                    height={360}
                />
            </div>

            <div className='p-10 flex gap-32'>
                <div>
                    <Image
                        className='w-[15rem] rounded-md'
                        src={item.poster_path ? `https://image.tmdb.org/t/p/original${item.poster_path}` : NoImage}
                        alt={item.title || "Movie Image"}
                        width={240}
                        height={360}
                    />
                </div>

                <div>
                    <h1 className='text-black text-[2rem]'>{item.original_title}</h1>
                    <p className='text-black text-[1.3rem]'>{item.release_date}</p>
                    <p className='text-black'>Director: {getDirector(item.credits?.crew || [])}</p>
                    <p className='text-black'>Writers: {getWriters(item.credits?.crew || [])}</p>
                    <p className='text-black'>Cast: {getCast(item.credits?.cast || [])}</p>
                    <p className='text-black'>Production Companies: {getProductionCompanies(item.production_companies || [])}</p>
                    {/* <p className='text-black mt-4'>Overview: {item.overview}</p> */}
                </div>
            </div>
        </div>
    );
};

export default Info;

