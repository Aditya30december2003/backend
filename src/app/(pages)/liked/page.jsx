import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import prisma from "@/app/libs/prismaDB";
import LikedListClient from '@/app/components/LikedListClient/LikedListClient'
export default async function LikedPages(){
  const session = await getServerSession(authOptions);

    if (!session) {
        return <p>You need to log in to view your watchlist.</p>;
    }

    const user = await prisma.user.findUnique({
        where: { email: session.user.email },
    });

    if (!user) {
        return <p>User not found. Please log in again.</p>;
    }

    const likedList = await prisma.liked.findMany({
      where: { userId: user.id },
      include: {
          movie: true,
      },
  });
  return <LikedListClient initialLikedList={likedList}/>
}
