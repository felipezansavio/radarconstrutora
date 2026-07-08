# Radar Construtora IA

Plataforma SaaS para empresas de esquadrias encontrarem oportunidades comerciais em construtoras próximas, com IA para análise de potencial de venda e CRM integrado.

Consulte o [projeto técnico completo](./docs/architecture.md) para arquitetura, módulos, integrações, estratégia de segurança e escalabilidade.

## Stack

- **Frontend**: Next.js 15, React 19, TypeScript, Tailwind CSS, Shadcn UI
- **Backend**: NestJS, TypeScript
- **Banco de dados**: PostgreSQL + PostGIS, Prisma ORM
- **Filas/Cache**: Redis + BullMQ
- **IA**: OpenAI API
- **Mapas**: Mapbox ou Google Maps API

## Estrutura do repositório

```
radarconstrutora/
├── frontend/          # Aplicação Next.js
├── backend/           # API NestJS
├── docs/               # Documentação de arquitetura
├── scripts/            # Scripts de instalação/setup
└── docker-compose.yml  # Orquestração local (Postgres+PostGIS, Redis, backend, frontend)
```

## Pré-requisitos

- Node.js 22+
- Docker e Docker Compose

## Configuração inicial

Rode o script de setup, que copia os `.env.example`, instala as dependências e sobe o banco/Redis via Docker:

```bash
npm run setup
```

Ou manualmente:

```bash
# 1. Variáveis de ambiente
cp .env.example .env
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env

# 2. Dependências
npm run install:all

# 3. Infraestrutura local (Postgres+PostGIS e Redis)
npm run docker:up

# 4. Migrations do Prisma
npm run prisma:migrate
```

## Desenvolvimento

```bash
npm run dev            # backend (:3001) e frontend (:3000) em paralelo
npm run dev:backend    # apenas o backend
npm run dev:frontend   # apenas o frontend
```

- API: http://localhost:3001/api
- Documentação da API (Swagger): http://localhost:3001/api/docs
- Health check: http://localhost:3001/api/health
- Frontend: http://localhost:3000

## Build de produção via Docker

```bash
docker compose up -d --build
```

## Scripts úteis

| Comando | Descrição |
|---|---|
| `npm run lint` | Lint em frontend e backend |
| `npm run format` | Formatação com Prettier em frontend e backend |
| `npm run build` | Build de produção de frontend e backend |
| `npm run prisma:studio --prefix backend` | Abre o Prisma Studio |
| `npm run docker:down` | Encerra os containers |
| `npm run docker:logs` | Acompanha os logs dos containers |

## Status do projeto

Base de infraestrutura configurada (frontend, backend, banco de dados, Docker). As funcionalidades do produto (radar de empreendimentos, IA de scoring, CRM) serão implementadas nas próximas etapas.
