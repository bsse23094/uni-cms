/** @type {import('next').NextConfig} */

const SUPABASE_HOST = 'ydhjblabejtmwvllsvkw.supabase.co';

/** HTTP response headers applied to every route */
const securityHeaders = [
  // Prevent browsers from MIME-sniffing the Content-Type
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  // Deny embedding in iframes (clickjacking protection)
  { key: 'X-Frame-Options', value: 'DENY' },
  // Reflect XSS attempts in legacy browsers
  { key: 'X-XSS-Protection', value: '1; mode=block' },
  // Control what info is sent in the Referer header
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  // Restrict browser feature access
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()',
  },
  // Force HTTPS for 1 year (enable once on HTTPS only)
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload',
  },
  // Content Security Policy
  {
    key: 'Content-Security-Policy',
    value: [
      `default-src 'self'`,
      // Scripts: self + Next.js inline chunks
      `script-src 'self' 'unsafe-inline' 'unsafe-eval'`,
      // Styles: self + inline (Tailwind)
      `style-src 'self' 'unsafe-inline'`,
      // Images: self + Supabase storage
      `img-src 'self' data: blob: https://${SUPABASE_HOST}`,
      // Fonts: self
      `font-src 'self'`,
      // Supabase API + auth
      `connect-src 'self' https://${SUPABASE_HOST} wss://${SUPABASE_HOST}`,
      // No plugins
      `object-src 'none'`,
      // Base tag restricted to same origin
      `base-uri 'self'`,
      // Form actions restricted to same origin
      `form-action 'self'`,
    ].join('; '),
  },
];

const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        port: '',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },
  experimental: {
    serverActions: {
      // Update this list with your production domain when deploying
      allowedOrigins: [
        'localhost:3000',
        process.env.NEXT_PUBLIC_APP_URL?.replace(/^https?:\/\//, '') ?? '',
      ].filter(Boolean),
    },
  },
  async headers() {
    return [
      {
        // Apply security headers to all routes
        source: '/(.*)',
        headers: securityHeaders,
      },
    ];
  },
};

module.exports = nextConfig;
