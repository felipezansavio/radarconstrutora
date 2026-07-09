import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  output: "standalone",
  // Sem isso, o Next detecta o monorepo (há um package-lock.json na raiz
  // do projeto) como workspace root e aninha a saída em
  // .next/standalone/frontend/server.js — o Dockerfile espera
  // .next/standalone/server.js direto, e o container falha ao iniciar.
  outputFileTracingRoot: path.join(__dirname),
};

export default nextConfig;
