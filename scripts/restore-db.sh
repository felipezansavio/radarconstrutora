#!/usr/bin/env bash
# Restaura um dump gerado por scripts/backup-db.sh. Usado em recuperação
# de desastre ou para clonar dados de produção em um ambiente novo.
#
# Uso:
#   ./scripts/restore-db.sh backups/radar_construtora_20260101T030000Z.dump
#
# ATENÇÃO: por padrão o restore roda em um banco vazio/novo (--clean --if-exists
# recriam os objetos existentes). Confirme o DATABASE_URL de destino antes
# de rodar — este script sobrescreve dados existentes.
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DUMP_FILE="${1:-}"

if [ -z "$DUMP_FILE" ]; then
  echo "Uso: $0 <arquivo.dump>" >&2
  exit 1
fi

if [ ! -f "$DUMP_FILE" ]; then
  echo "Arquivo de backup não encontrado: $DUMP_FILE" >&2
  exit 1
fi

if [ -z "${DATABASE_URL:-}" ] && [ -f "$ROOT_DIR/backend/.env" ]; then
  DATABASE_URL="$(grep -E '^DATABASE_URL=' "$ROOT_DIR/backend/.env" | tail -1 | cut -d= -f2- | tr -d '"')"
fi

if [ -z "${DATABASE_URL:-}" ]; then
  echo "DATABASE_URL não definida (nem em backend/.env). Abortando." >&2
  exit 1
fi

# pg_restore não entende parâmetros de query no estilo Prisma (?schema=public).
DATABASE_URL="${DATABASE_URL%%\?*}"

command -v pg_restore >/dev/null 2>&1 || {
  echo "pg_restore não encontrado. Instale o cliente do PostgreSQL antes de continuar." >&2
  exit 1
}

echo "==> Restaurando $DUMP_FILE em:"
echo "    $DATABASE_URL"
read -r -p "Confirma? Isso sobrescreve dados existentes no destino. [s/N] " CONFIRM
if [[ ! "$CONFIRM" =~ ^[sS]$ ]]; then
  echo "Cancelado."
  exit 1
fi

pg_restore --clean --if-exists --no-owner --dbname="$DATABASE_URL" "$DUMP_FILE"

echo "==> Restore concluído. Rode 'npm run prisma:generate --prefix backend' se necessário."
