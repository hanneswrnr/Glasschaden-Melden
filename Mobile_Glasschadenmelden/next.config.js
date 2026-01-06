/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  // Static Export für Capacitor
  output: 'export',
  trailingSlash: true,

  // Bilder für Static Export
  images: {
    unoptimized: true,
  },
}

module.exports = nextConfig
