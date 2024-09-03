/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  swcMinify: true,
  webpack: (config) => {
    config.module.rules.push({
      test: /\.node$/,
      use: 'ignore-loader',
    })
    return config
  },
  experimental: {
    taint: true,
  },
}

module.exports = nextConfig
