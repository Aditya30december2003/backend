"use client"
import { useSession } from 'next-auth/react'
import Logout from '@/app/components/Logout/Logout'
import Image from 'next/image'
export default function Page() {
  const { data: session , status } = useSession()

  if(status === "unauthenticated"){
    return <div>Login first!!!</div>
  }

  if(status === "loading"){
    return(
        <>
        <div>Loading....</div>
        </>
    )
   }

  return (
    <div className='flex items-center'>
       {session?.user?.image ?<Image className='rounded-[100%] cursor-pointer' src={session?.user?.image} width={100} height={100} alt='Profle Image' /> : <Image className='border-2 border-black rounded-[100%] p-2' src='/img/profile.png' width={100} height={100} alt='Profle Image' />}
       <div className="profile-info flex items-center">
        <p>{session?.user?.name}</p>
        <button>Edit Profile</button>
        <label htmlFor="">Blogs or Posts</label>
        <div>Followers</div>
        <div>Following</div>
        <p>{session?.user?.email}</p>
      </div>
      <Logout />
    </div>
  );
}

