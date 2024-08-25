import Image from "next/image";
import { getServerSession } from "next-auth";
import { authOptions } from "./api/auth/[...nextauth]/route";
import HomePage from '@/app/(pages)/Home/Home'
import { redirect } from "next/navigation";
export default async function Home() {
  const session = await getServerSession(authOptions);

  // if (!session) {
  //   redirect("/login");
  // }

  return (
    <main className="">
      <div className="">
       <HomePage />
      </div>
    </main>
  );
}
