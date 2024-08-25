const nextConfig = {
      // output:"export", 
      reactStrictMode: true,
      images: {
        domains: [
          'lh3.googleusercontent.com', 
          'avatars.githubusercontent.com',
          "firebasestorage.googleapis.com"
        ],
        unoptimized: true, // Disable image optimization
      },
    };
    
    export default nextConfig;