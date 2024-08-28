import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import prisma from "@/app/libs/prismaDB";

// Helper function to get user
async function getUser(session) {
    if (!session || !session.user || !session.user.email) {
        throw new Error("Unauthorized");
    }
    const user = await prisma.user.findUnique({
        where: { email: session.user.email },
    });
    if (!user) {
        throw new Error("User not found");
    }
    return user;
}

// Handle POST request to create a new review comment
export async function POST(req) {
    try {
        // Fetch session and user
        const session = await getServerSession(authOptions);
        const user = await getUser(session);

        // Parse request body
        const body = await req.json();
        const { reviewId, comment } = body;

        if (!reviewId || !comment) {
            return new Response("Invalid or missing data", { status: 400 });
        }

        // Create a new review comment
        const newComment = await prisma.reviewComment.create({
            data: {
                comment,
                userId: user.id,
                reviewId,
            },
        });

        return new Response(JSON.stringify(newComment), { status: 201 });
    } catch (error) {
        console.error("Error in POST function:", error);
        return new Response(error.message, { status: error.message === "Unauthorized" ? 401 : 500 });
    }
}

// Handle GET request to fetch comments for a specific review
export async function GET(req) {
    try {
        // Parse query parameters
        const url = new URL(req.url);
        const reviewId = url.searchParams.get('reviewId');

        if (!reviewId) {
            return new Response("Review ID is required", { status: 400 });
        }

        // Fetch comments for the given review
        const comments = await prisma.reviewComment.findMany({
            where: { reviewId },
            include: {
                user: {
                    select: { name: true, image: true },
                },
            },
            orderBy: { createdAt: 'asc' }, // Order by creation time
        });

        return new Response(JSON.stringify(comments), { status: 200 });
    } catch (error) {
        console.error("Error in GET function:", error);
        return new Response("Internal server error", { status: 500 });
    }
}
