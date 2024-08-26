// src/app/components/NavbarServer.jsx
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import Navbar from '../Navbar/Navbar';

export default async function NavbarServer() {
    const session = await getServerSession(authOptions);
    return <Navbar session={session} />;
}
