import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  images: {
    // Next 16 : defaut [75]. On ajoute 90 pour le poster du hero (LCP).
    qualities: [75, 90],
  },
};

export default nextConfig;
