import React from 'react';
import Link from 'next/link';
import { getServerSession } from 'next-auth/next'; // Import from next-auth/next for Next.js 12 or higher
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

const Navbar = async () => {
    const session = await getServerSession(authOptions); // Await the session

    if (!session) {
        return (
            <ul>
                <Link href='/login'>Login</Link>
                <Link href='/signup'>Signup</Link>
            </ul>
        );
    } else {
        return (
            <div>
                <ul>
                    <Link href='/profile' className='cursor-pointer'>Home</Link>
                    <li className='cursor-pointer'>WatchList</li>
                    <li className='cursor-pointer'>Liked/Film Collection</li>
                    <li className='cursor-pointer'>About</li>
                    <li className='cursor-pointer'>Profile</li>
                    <li className='cursor-pointer'>Write</li>
                </ul>
            </div>
        );
    }
};

export default Navbar;
