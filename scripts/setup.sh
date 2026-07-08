#!/usr/bin/env bash
# Configura o ambiente de desenvolvimento do Radar Construtora IA:
# copia os arquivos de variáveis de ambiente, instala as dependências
# de frontend/backend, sobe Postgres+PostGIS e Redis via Docker Compose
# e aplica as migrations iniciais do Prisma.
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

echo "==> Verificando pré-requisitos (docker, node, npm)..."
command -v docker >/dev/null 2>&1 || {
  echo "Docker não encontrado. Instale o Docker antes de continuar." >&2
  exit 1
}
command -v node >/dev/null 2>&1 || {
  echo "Node.js não encontrado. Instale o Node.js 22+ antes de continuar." >&2
  exit 1
}

copy_env() {
  local dir="$1"
  if [ ! -f "$dir/.env" ]; then
    cp "$dir/.env.example" "$dir/.env"
    echo "==> Criado $dir/.env a partir de $dir/.env.example"
  else
    echo "==> $dir/.env já existe, mantendo arquivo atual"
  fi
}

echo "==> Configurando variáveis de ambiente..."
copy_env "."
copy_env "backend"
copy_env "frontend"

echo "==> Instalando dependências do backend..."
npm install --prefix backend

echo "==> Instalando dependências do frontend..."
npm install --prefix frontend

echo "==> Subindo Postgres (PostGIS) e Redis via Docker Compose..."
docker compose up -d postgres redis

echo "==> Aguardando o banco de dados ficar saudável..."
until [ "$(docker compose ps postgres --format '{{.Health}}')" = "healthy" ]; do
  sleep 2
done

echo "==> Aplicando migrations do Prisma..."
npm run prisma:migrate --prefix backend -- --name init

echo ""
echo "Ambiente configurado com sucesso."
echo "  - Backend:  npm run dev:backend   (http://localhost:3001/api)"
echo "  - Frontend: npm run dev:frontend  (http://localhost:3000)"
echo "  - Ambos:    npm run dev"
