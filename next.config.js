/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'omphznbkkldoyfcpisvm.supabase.co',
        pathname: '/**',
      },
    ],
  },
};

module.exports = nextConfig;
