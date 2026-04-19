/** @type {import('next').NextConfig} */
const nextConfig = {
  images: { unoptimized: true },
  transpilePackages: ["@edify/shared"],
};

export default nextConfig;
