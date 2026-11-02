/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  webpack: (config) => {
    // Optional deps pulled in by wallet libraries; not needed in the browser.
    config.externals.push("pino-pretty", "lokijs", "encoding");
    // The wagmi connectors barrel references optional x402 payment packages we never use.
    config.resolve.alias = {
      ...config.resolve.alias,
      "@x402/core/client": false,
      "@x402/evm": false,
      "@x402/evm/exact/client": false,
      "@x402/evm/upto/client": false,
      "@x402/svm/exact/client": false,
    };
    return config;
  },
};
export default nextConfig;
