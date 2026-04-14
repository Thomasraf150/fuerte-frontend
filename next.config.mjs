/** @type {import('next').NextConfig} */
const nextConfig = {
  // Produce a self-contained server bundle for Docker production builds.
  // Inert during `npm run dev`, so dev workflow is unaffected.
  output: 'standalone',
  images: {
    domains: ['localhost', '58.69.102.194'],
  },
  // Proxy /storage/* to the Laravel backend so PDFs and uploaded files are
  // served correctly regardless of how NEXT_PUBLIC_BASE_URL was baked in.
  //
  // BACKEND_URL must be set at BUILD time (docker build arg / env in dev server).
  // It uses the internal Docker service name so the Next.js server proxies via
  // the private network — never the external public IP.
  //
  // Docker prod:  build arg  BACKEND_URL=http://nginx  (Dockerfile.prod ARG)
  // Docker dev:   env var    BACKEND_URL=http://nginx  (docker-compose.yml)
  // Local dev:    .env.local BACKEND_URL=http://localhost:8080
  async rewrites() {
    const backendUrl = process.env.BACKEND_URL || 'http://nginx';
    return [
      {
        source: '/storage/:path*',
        destination: `${backendUrl}/storage/:path*`,
      },
    ];
  },
};

export default nextConfig;
