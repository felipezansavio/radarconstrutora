#!/usr/bin/env bash
# Backup diário do banco Postgres do Radar Construtora IA.
# Gera um dump comprimido com timestamp e aplica a política de retenção
# (RETENTION_DAYS, padrão 30 dias). Pensado para rodar via cron/agendador
# do provedor de hospedagem (ex.: cron job diário de madrugada).
#
# Uso:
#   DATABASE_URL="postgresql://user:pass@host:5432/db" ./scripts/backup-db.sh
#   ./scripts/backup-db.sh                # lê DATABASE_URL de backend/.env
#
# Variáveis opcionais:
#   BACKUP_DIR       diretório de destino dos dumps (padrão: ./backups)
#   RETENTION_DAYS   dias de retenção antes de apagar dumps antigos (padrão: 30)
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BACKUP_DIR="${BACKUP_DIR:-$ROOT_DIR/backups}"
RETENTION_DAYS="${RETENTION_DAYS:-30}"

if [ -z "${DATABASE_URL:-}" ] && [ -f "$ROOT_DIR/backend/.env" ]; then
  DATABASE_URL="$(grep -E '^DATABASE_URL=' "$ROOT_DIR/backend/.env" | tail -1 | cut -d= -f2- | tr -d '"')"
fi

if [ -z "${DATABASE_URL:-}" ]; then
  echo "DATABASE_URL não definida (nem em backend/.env). Abortando." >&2
  exit 1
fi

# pg_dump não entende parâmetros de query no estilo Prisma (?schema=public).
DATABASE_URL="${DATABASE_URL%%\?*}"

command -v pg_dump >/dev/null 2>&1 || {
  echo "pg_dump não encontrado. Instale o cliente do PostgreSQL antes de continuar." >&2
  exit 1
}

mkdir -p "$BACKUP_DIR"

TIMESTAMP="$(date -u +%Y%m%dT%H%M%SZ)"
DUMP_FILE="$BACKUP_DIR/radar_construtora_${TIMESTAMP}.dump"

echo "==> Gerando backup em $DUMP_FILE"
pg_dump --format=custom --file="$DUMP_FILE" --dbname="$DATABASE_URL"

echo "==> Backup concluído: $(du -h "$DUMP_FILE" | cut -f1)"

echo "==> Removendo backups com mais de ${RETENTION_DAYS} dias..."
find "$BACKUP_DIR" -name 'radar_construtora_*.dump' -mtime "+${RETENTION_DAYS}" -print -delete

echo "==> Backups atuais em $BACKUP_DIR:"
ls -lh "$BACKUP_DIR"
