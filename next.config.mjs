/** @type {import('next').NextConfig} */
const nextConfig = {
  // Produce a self-contained server bundle for Docker production builds.
  // Inert during `npm run dev`, so dev workflow is unaffected.
  output: 'standalone',
  images: {
    domains: ['localhost', '58.69.102.194'],
  },
};

export default nextConfig;
