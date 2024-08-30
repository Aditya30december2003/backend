"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import MovieInfo from "@/app/components/InfoComponents/MovieInfo/MovieInfo";
import Reviews from "@/app/components/Reviews/review";
import Hero from '@/app/components/InfoComponents/Hero/Hero';

const Info = () => {
    const [item, setItem] = useState({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [averageRating, setAverageRating] = useState(null);
    const [userRating, setUserRating] = useState(0);
    const [ratingCount, setRatingCount] = useState(0);

    const params = useParams();
    const movieId = params.id;

    useEffect(() => {
        const getData = async () => {
            try {
                if (!movieId) return;

                const [movieResponse, creditsResponse, ratingResponse] = await Promise.all([
                    fetch(`https://api.themoviedb.org/3/movie/${movieId}?api_key=${process.env.NEXT_PUBLIC_API_KEY}`),
                    fetch(`https://api.themoviedb.org/3/movie/${movieId}/credits?api_key=${process.env.NEXT_PUBLIC_API_KEY}`),
                    fetch(`/api/userRating?movieId=${movieId}`)
                ]);

                if (!movieResponse.ok || !creditsResponse.ok || !ratingResponse.ok) {
                    throw new Error('Network response was not ok');
                }

                const [movieData, creditsData, ratingData] = await Promise.all([
                    movieResponse.json(),
                    creditsResponse.json(),
                    ratingResponse.json()
                ]);

                setItem({ ...movieData, credits: creditsData });
                setAverageRating(ratingData.averageRating);
                setUserRating(ratingData.userRating);
                setRatingCount(ratingData.ratingCount);
            } catch (error) {
                setError(error.message);
            } finally {
                setLoading(false);
            }
        };

        getData();
    }, [movieId]);

    if (loading) {
        return <p className="text-center">Loading...</p>;
    }

    if (error) {
        return <p className="text-center text-red-500">Error: {error}</p>;
    }

    return (
        <div>
            <Hero item={item} />

            
            <MovieInfo
                item={item}
                averageRating={averageRating}
                userRating={userRating}
                ratingCount={ratingCount}
                onRatingChange={setUserRating}
            />

            <Reviews movieId={movieId} />
        </div>
    );
};

export default Info;

