/** @type {import('next').NextConfig} */
const nextConfig = {
  // Gera um build "standalone" enxuto, ideal para a imagem Docker.
  output: "standalone",
  reactStrictMode: true,
};

export default nextConfig;
