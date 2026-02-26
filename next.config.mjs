/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    transpilePackages: ['phaser'],
    webpack: (config) => {
        config.module.rules.push({
            test: /\.node$/,
            use: 'raw-loader',
        });
        return config;
    },
};

export default nextConfig;
