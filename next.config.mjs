import { withSentryConfig } from '@sentry/nextjs';

/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    PORT: '3500',
  },
  images: {
    formats: ['image/avif', 'image/webp'],
  },
  poweredByHeader: false,
  compress: true,
  reactStrictMode: true,
  async headers() {
    return [{
      source: '/(.*)',
      headers: [
        { key: 'X-Frame-Options', value: 'DENY' },
        { key: 'X-Content-Type-Options', value: 'nosniff' },
        { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains' },
      ],
    }];
  },
};

export default withSentryConfig(nextConfig, {
  silent: true,
  disableServerWebpackPlugin: true,
  disableClientWebpackPlugin: true,
  hideSourceMaps: true,
});
