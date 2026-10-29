/** @type {import('next').NextConfig} */
const nextConfig = {
  // Produce a self-contained server bundle for Docker production builds.
  // Inert during `npm run dev`, so dev workflow is unaffected.
  output: 'standalone',
  images: {
    domains: ['localhost', '58.69.102.194'],
  },
  // Anti-framing on every route: no other site may load Fuerte in a frame
  // (clickjacking a signed-in user's clicks). X-Frame-Options for older
  // browsers, CSP frame-ancestors for current ones. The CSP carries ONLY
  // frame-ancestors on purpose: a fuller policy would need auditing every
  // script, style and connect source first. The app frames none of its own
  // pages (no <iframe> in src/), so 'none' costs nothing.
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'Content-Security-Policy', value: "frame-ancestors 'none'" },
        ],
      },
    ];
  },
  // Proxy /storage/* to the Laravel backend so uploaded files (borrower
  // attachments, photos, company logo) are served correctly
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
      // Signed check-voucher Excel export links, for the same reason. The
      // workbook is no longer written under /storage/xlsx; it is built on
      // demand at /api/exports/check-vouchers.
      {
        source: '/api/exports/:path*',
        destination: `${backendUrl}/api/exports/:path*`,
      },
    ];
  },
};

export default nextConfig;
