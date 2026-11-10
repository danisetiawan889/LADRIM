/** @type {import('next').NextConfig} */
const nextConfig = {
  allowedDevOrigins: ['*.trycloudflare.com', 'localhost:3000'],
  async rewrites() {
    // Browser talks to same-origin /api/*; Next proxies to the Express server (keeps cookies first-party).
    return [{ source: '/api/:path*', destination: `${process.env.API_URL ?? 'http://localhost:4000'}/api/:path*` }];
  },
};
export default nextConfig;
