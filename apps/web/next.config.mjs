/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@edify/shared"],
  images: { unoptimized: true },
};

export default nextConfig;
