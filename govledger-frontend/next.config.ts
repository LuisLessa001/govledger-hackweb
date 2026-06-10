import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 1. Desativa o compilador do React para remover o peso da análise profunda
  reactCompiler: false,

  // 2. Pula a checagem de tipos do TypeScript durante o build (ganho brutal de tempo)
  typescript: {
    ignoreBuildErrors: true,
  },

  // 3. Pula a verificação do ESLint durante o build
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;