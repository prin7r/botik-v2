import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  devIndicators: {
    position: 'bottom-right',
  },
  poweredByHeader: false,
  reactStrictMode: true,
  outputFileTracingIncludes: {
    '/': ['./public/**/*'],
  },
  async headers() {
    return [
      {
        source: '/api/agent/logs/stream',
        headers: [
          { key: 'Content-Type', value: 'text/event-stream' },
          { key: 'Cache-Control', value: 'no-cache, no-transform' },
          { key: 'Connection', value: 'keep-alive' },
        ],
      },
    ];
  },
};

export default nextConfig;
