import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import prisma from "@/app/libs/prismaDB";

export async function POST(req) {
    try {
        let session;
        try {
            session = await getServerSession(authOptions);
        } catch (error) {
            return new Response("Error getting session", { status: 500 });
        }

        if (!session || !session.user || !session.user.email) {
            console.log("No session found or user email missing");
            return new Response("Unauthorized", { status: 401 });
        }

        let body;
        try {
            body = await req.json();
        } catch (error) {
            return new Response("Error parsing request body", { status: 400 });
        }

        const { movieId, title, posterUrl } = body;

        if (!movieId || !title) {
            console.log("Missing data");
            return new Response("Missing data", { status: 400 });
        }

        // Fetch user ID using the email
        let user;
        try {
            user = await prisma.user.findUnique({
                where: {
                    email: session.user.email,
                },
            });
            if (!user) {
                console.log("User not found");
                return new Response("User not found", { status: 404 });
            }
        } catch (error) {
            console.error("Error finding user:", error);
            return new Response("Error finding user", { status: 500 });
        }

        // Ensure the movie exists in the database
        let movie;
        try {
            movie = await prisma.movie.findUnique({ where: { tmdbId: movieId } });
            if (!movie) {
                movie = await prisma.movie.create({
                    data: {
                        tmdbId: movieId,
                        title,
                        posterUrl,
                    },
                });
            }
        } catch (error) {
            console.error("Error finding/creating movie:", error);
            return new Response("Error finding/creating movie", { status: 500 });
        }

        // Check if the movie is already in the user's liked list
        try {
            const likedItem = await prisma.liked.findUnique({
                where: {
                    userId_movieId: {
                        userId: user.id,
                        movieId: movie.id,
                    },
                },
            });

            if (likedItem) {
                return new Response("Movie already in liked list", { status: 409 }); // 409 Conflict
            }

            // Add movie to the user's liked list
            const newLikedItem = await prisma.liked.create({
                data: {
                    userId: user.id,
                    movieId: movie.id,
                },
            });

            return new Response(JSON.stringify(newLikedItem), { status: 201 });
        } catch (error) {
            console.error("Error adding to liked:", error);
            return new Response("Error adding to liked", { status: 500 });
        }
    } catch (error) {
        console.error("Unhandled error in POST function:", error);
        return new Response(`Internal Server Error: ${error.message}`, { status: 500 });
    }
}
