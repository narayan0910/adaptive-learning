/** @type {import('next').NextConfig} */
const nextConfig = {
  // Avoid stale webpack server chunks on Windows (e.g. missing ./948.js) when using `npm run dev:webpack`
  webpack: (config, { dev, isServer }) => {
    if (dev && isServer) {
      config.cache = false;
    }
    return config;
  },
};  
export default nextConfig;
