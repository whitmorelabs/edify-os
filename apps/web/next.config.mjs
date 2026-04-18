/** @type {import('next').NextConfig} */
const nextConfig = {
  // output: "export" removed — app uses API routes which require server mode.
  // Deployed to Vercel as a Next.js serverless app.
  images: { unoptimized: true },
  transpilePackages: ["@edify/shared"],
};

export default nextConfig;
