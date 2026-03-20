import { withSentryConfig } from '@sentry/nextjs';

/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    PORT: '3500',
  },
  images: {
    formats: ['image/avif', 'image/webp'],
  },
};

export default withSentryConfig(nextConfig, {
  silent: true,
  disableServerWebpackPlugin: true,
  disableClientWebpackPlugin: true,
  hideSourceMaps: true,
});
