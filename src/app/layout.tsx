import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Provider from '@/app/context/AuthContext'
const inter = Inter({ subsets: ["latin"] });
import ToastContext from '@/app/context/ToastContext'
import Navbar from '@/app/components/NavbarServer/NavbarServer'
import Footer from '@/app/components/Footer/footer'
export const metadata: Metadata = {
  title: "Create Next App",
  description: "Generated by create next app",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Provider>
        <Navbar />
        <ToastContext />
        {children}
        {/* <Footer /> */}
        </Provider>
      </body>
    </html>
  );
}
