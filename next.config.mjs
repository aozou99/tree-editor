import { initOpenNextCloudflareForDev } from '@opennextjs/cloudflare';
await initOpenNextCloudflareForDev();

/** @type {import('next').NextConfig} */
const nextConfig = {
    eslint: {
        ignoreDuringBuilds: true,
    },
    typescript: {
        ignoreBuildErrors: true,
    },
    images: {
        unoptimized: true,
    },
};

export default nextConfig;
