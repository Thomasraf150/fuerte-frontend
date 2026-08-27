/** @type {import('next').NextConfig} */
const nextConfig = {
  // Produce a self-contained server bundle for Docker production builds.
  // Inert during `npm run dev`, so dev workflow is unaffected.
  output: 'standalone',
  images: {
    domains: ['localhost', '58.69.102.194'],
  },
  // Proxy /storage/* to the Laravel backend so uploaded files (borrower
  // attachments, photos, company logo) and xlsx exports are served correctly
  // regardless of how NEXT_PUBLIC_BASE_URL was baked in.
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
      // Signed print links. Generated PDFs are no longer written under
      // /storage — they render on demand at /api/pdf/{document}.
      //
      // Scoped to /api/pdf deliberately. A blanket /api/* rewrite would also
      // swallow Next's own route space. In production nginx already routes
      // /api to PHP-FPM before the frontend container is reached, so this
      // matters for dev (and for anything hitting Next directly) — without it
      // the two hooks that navigate with a RELATIVE url (useCoa,
      // useFinancialStatement) resolve against :3000 and 404.
      {
        source: '/api/pdf/:path*',
        destination: `${backendUrl}/api/pdf/:path*`,
      },
    ];
  },
};

export default nextConfig;
