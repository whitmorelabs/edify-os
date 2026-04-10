/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "export",
  transpilePackages: ["@edify/shared"],
  images: { unoptimized: true },
};

export default nextConfig;
