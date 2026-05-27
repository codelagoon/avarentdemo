/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  typescript: {
    ignoreBuildErrors: true,
  },
  allowedDevOrigins: ['127.0.0.1', 'localhost'],
};

export default nextConfig;
