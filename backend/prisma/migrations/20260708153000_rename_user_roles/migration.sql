-- Renomeia os valores do enum "user_role" para os níveis em português
-- pedidos (ADMIN, GESTOR, VENDEDOR), preservando os dados existentes.
-- Postgres não suporta renomear/remover valores de enum diretamente
-- quando ainda em uso, então recriamos o tipo e migramos a coluna.

ALTER TYPE "user_role" RENAME TO "user_role_old";

CREATE TYPE "user_role" AS ENUM ('ADMIN', 'GESTOR', 'VENDEDOR');

ALTER TABLE "users"
  ALTER COLUMN "role" DROP DEFAULT,
  ALTER COLUMN "role" TYPE "user_role" USING (
    CASE "role"::text
      WHEN 'MANAGER' THEN 'GESTOR'
      WHEN 'SALES_REP' THEN 'VENDEDOR'
      ELSE "role"::text
    END
  )::"user_role",
  ALTER COLUMN "role" SET DEFAULT 'VENDEDOR';

DROP TYPE "user_role_old";
