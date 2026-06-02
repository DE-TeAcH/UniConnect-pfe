/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    serverExternalPackages: ['pdf-parse'],
    async rewrites() {
        return [
            {
                source: '/api/:path*.php',
                destination: '/api/:path*',
            },
        ];
    },
};

module.exports = nextConfig;
