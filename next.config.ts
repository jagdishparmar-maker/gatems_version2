import type {NextConfig} from 'next';

const defaultPocketBaseUrl = 'https://pocketbase.intoship.cloud';
const pocketBaseUrl = process.env.NEXT_PUBLIC_POCKETBASE_URL?.trim() || defaultPocketBaseUrl;
let pocketbaseHostname = 'pocketbase.intoship.cloud';
try {
  pocketbaseHostname = new URL(pocketBaseUrl).hostname;
} catch {
  pocketbaseHostname = 'pocketbase.intoship.cloud';
}

const extraAllowedDevOrigins =
  process.env.ALLOWED_DEV_ORIGINS?.split(',')
    .map((s) => s.trim())
    .filter(Boolean) ?? [];

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Dev-only: hostnames allowed to load /_next/* when not same-origin (e.g. LAN IP, tunnel).
  allowedDevOrigins: [
    '192.168.3.99',
    'ais-dev-o3ossmudatn2prgxvboki6-296961921235.asia-southeast1.run.app',
    'ais-pre-o3ossmudatn2prgxvboki6-296961921235.asia-southeast1.run.app',
    ...extraAllowedDevOrigins,
  ],
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: false,
  },
  // Allow access to remote image placeholder.
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'picsum.photos',
        port: '',
        pathname: '/**', // This allows any path under the hostname
      },
      {
        protocol: 'https',
        hostname: pocketbaseHostname,
        port: '',
        pathname: '/**',
      },
    ],
  },
  output: 'standalone',
  transpilePackages: ['motion'],
  webpack: (config, {dev}) => {
    // HMR is disabled in AI Studio via DISABLE_HMR env var.
    // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
    if (dev && process.env.DISABLE_HMR === 'true') {
      config.watchOptions = {
        ignored: /.*/,
      };
    }
    return config;
  },
};

export default nextConfig;
