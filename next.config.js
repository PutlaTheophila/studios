/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      // allow Supabase Storage images
      { protocol: 'https', hostname: '**.supabase.co' }
    ]
  }
};

module.exports = nextConfig;
