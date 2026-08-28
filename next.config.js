/** @type {import('next').NextConfig} */
const nextConfig = {
  // Next.js 14 option (renamed to serverExternalPackages in Next.js 15).
  // Prevents webpack from bundling packages that use ESM/native syntax
  // incompatible with the SWC loader (e.g. cheerio → undici private fields).
  // Scrapers run server-side only, so these can be required at runtime.
  // Next.js 14 uses experimental.serverComponentsExternalPackages (renamed in v15)
  experimental: {
    serverComponentsExternalPackages: ['cheerio', 'undici'],
  },
};

module.exports = nextConfig;
