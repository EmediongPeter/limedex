/** @type {import('next').NextConfig} */
const nextConfig =  {
    eslint: {
      ignoreDuringBuilds: true, // Ignores ESLint errors
    },
    typescript: {
      ignoreBuildErrors: true, // Ignores TypeScript errors
    },
  };

export default nextConfig
