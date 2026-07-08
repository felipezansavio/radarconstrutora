# Radar Construtora IA — Projeto Técnico (Parte 1: Arquitetura e Planejamento)

> Documento de arquitetura de referência. Nenhum código de aplicação é entregue nesta fase — o objetivo é validar o desenho técnico antes da implementação.

## Visão do Produto

SaaS B2B que permite a empresas de esquadrias (janelas, portas, fachadas) identificar construtoras e empreendimentos próximos que estão em fase de lançamento ou construção, classificar automaticamente o potencial comercial de cada oportunidade usando IA, e gerenciar o relacionamento comercial em um CRM dedicado.

---

## 1. Arquitetura Geral do Sistema

### 1.1 Estilo arquitetural

Arquitetura de **monólito modular** no backend (NestJS com módulos bem isolados por domínio) para o MVP, com fronteiras de módulo desenhadas para permitir extração futura em serviços independentes (ex.: o módulo de IA e o de scraping/ingestão de dados são os primeiros candidatos a virar serviços separados, pois têm perfis de carga e custo muito diferentes do restante do sistema).

Justificativa: neste estágio, um monólito modular reduz custo operacional e complexidade de deploy, mas a separação em módulos com contratos claros (interfaces, DTOs, filas de eventos internas) evita reescrita quando for necessário migrar para microsserviços.

### 1.2 Diagrama de alto nível (lógico)

```
                                   ┌────────────────────────┐
                                   │        Usuários         │
                                   │ (Comerciais, Gestores)   │
                                   └────────────┬─────────────┘
                                                │ HTTPS
                                   ┌────────────▼─────────────┐
                                   │   Frontend (Next.js 15)   │
                                   │  React 19 + TS + Tailwind │
                                   │       + Shadcn UI         │
                                   └────────────┬─────────────┘
                                                │ REST/GraphQL (HTTPS)
                                                │ WebSocket (notificações)
                                   ┌────────────▼─────────────┐
                                   │      API Gateway /        │
                                   │   BFF (NestJS - Edge)     │
                                   │  Auth, Rate limit, Cache  │
                                   └────────────┬─────────────┘
                     ┌──────────────────────────┼──────────────────────────┐
                     │                          │                          │
           ┌─────────▼─────────┐     ┌──────────▼─────────┐     ┌──────────▼─────────┐
           │  Módulo Core       │     │  Módulo IA          │     │  Módulo Ingestão    │
           │ (Empresas, Leads,  │     │ (Scoring, Análise,  │     │ (Scraping, APIs de  │
           │  CRM, Usuários)    │     │  Enriquecimento)    │     │  construtoras, geo) │
           └─────────┬─────────┘     └──────────┬─────────┘     └──────────┬─────────┘
                     │                          │                          │
                     │               ┌──────────▼─────────┐                │
                     │               │   OpenAI API        │                │
                     │               └────────────────────┘                │
                     │                                                     │
           ┌─────────▼──────────────────────────────────────▼─────────────▼───────┐
           │                        Camada de Persistência                         │
           │   PostgreSQL + PostGIS (dados geoespaciais) via Prisma ORM             │
           │   Redis (cache, filas, sessões) | Object Storage (S3-compatible)      │
           └─────────────────────────────────────────────────────────────────────┘
                                                │
                                   ┌────────────▼─────────────┐
                                   │   Integrações externas    │
                                   │ Mapbox/Google Maps, CNPJ,  │
                                   │ Receita Federal, CUB/dados │
                                   │ de obras, e-mail, WhatsApp │
                                   └───────────────────────────┘
```

### 1.3 Componentes principais

| Componente | Responsabilidade |
|---|---|
| **Frontend Web (Next.js)** | Dashboard, mapa interativo, CRM, relatórios, autenticação de UI |
| **API/BFF (NestJS)** | Autenticação, autorização, orquestração de módulos, exposição de API REST/GraphQL |
| **Módulo Core** | Regras de negócio de empresas, empreendimentos, leads, pipeline de CRM |
| **Módulo Geo** | Busca por raio, geocodificação, cálculo de distância (PostGIS) |
| **Módulo IA** | Prompt engineering, scoring de oportunidade, resumo/enriquecimento de dados via OpenAI |
| **Módulo de Ingestão** | Workers assíncronos que coletam dados de construtoras/empreendimentos (scraping ético, APIs públicas, importação manual/CSV) |
| **Fila de jobs (BullMQ/Redis)** | Processamento assíncrono de scraping, scoring em lote, envio de notificações |
| **Banco de dados** | PostgreSQL + PostGIS via Prisma |
| **Cache** | Redis para sessões, rate limiting, cache de queries geoespaciais |
| **Observabilidade** | Logs estruturados, métricas, tracing distribuído |

---

## 2. Estrutura de Pastas do Frontend (Next.js 15 + React 19)

Uso do **App Router**, organização por *feature* (colocation) com camada compartilhada de *design system*.

```
frontend/
├── src/
│   ├── app/                          # App Router (rotas)
│   │   ├── (auth)/
│   │   │   ├── login/page.tsx
│   │   │   ├── registro/page.tsx
│   │   │   └── esqueci-senha/page.tsx
│   │   ├── (dashboard)/
│   │   │   ├── layout.tsx            # Layout autenticado (sidebar, topbar)
│   │   │   ├── page.tsx              # Home/overview
│   │   │   ├── radar/
│   │   │   │   ├── page.tsx          # Mapa + busca por raio
│   │   │   │   └── [empreendimentoId]/page.tsx
│   │   │   ├── construtoras/
│   │   │   │   ├── page.tsx
│   │   │   │   └── [id]/page.tsx
│   │   │   ├── leads/
│   │   │   │   ├── page.tsx          # Kanban/lista do CRM
│   │   │   │   └── [id]/page.tsx
│   │   │   ├── relatorios/page.tsx
│   │   │   └── configuracoes/
│   │   │       ├── equipe/page.tsx
│   │   │       ├── integracoes/page.tsx
│   │   │       └── plano-e-cobranca/page.tsx
│   │   ├── api/                      # Route handlers (BFF-only, se necessário)
│   │   ├── layout.tsx                # Root layout
│   │   ├── globals.css
│   │   └── not-found.tsx
│   │
│   ├── components/
│   │   ├── ui/                       # Shadcn UI (button, dialog, table...)
│   │   ├── map/                      # Componentes de mapa (Mapbox/Google Maps wrapper)
│   │   ├── crm/                      # Kanban, cards de lead, timeline
│   │   ├── charts/                   # Gráficos de score/relatórios
│   │   └── layout/                   # Sidebar, Topbar, Shell
│   │
│   ├── features/                     # Lógica de domínio por feature (hooks, actions, schemas)
│   │   ├── radar/
│   │   │   ├── hooks/
│   │   │   ├── actions.ts            # Server Actions
│   │   │   ├── schema.ts             # Zod schemas
│   │   │   └── types.ts
│   │   ├── construtoras/
│   │   ├── leads/
│   │   ├── ia-scoring/
│   │   └── auth/
│   │
│   ├── lib/
│   │   ├── api-client.ts             # Cliente HTTP tipado (fetch wrapper)
│   │   ├── auth/                     # Sessão, middlewares de auth
│   │   ├── maps/                     # Config e helpers Mapbox/Google
│   │   ├── utils.ts
│   │   └── constants.ts
│   │
│   ├── hooks/                        # Hooks genéricos (useDebounce, useGeolocation...)
│   ├── stores/                       # Estado global leve (Zustand) se necessário
│   ├── styles/                       # Config Tailwind adicional
│   └── types/                        # Tipos compartilhados/gerados da API
│
├── public/
├── middleware.ts                     # Auth/redirects em edge
├── next.config.ts
├── tailwind.config.ts
├── components.json                   # Config Shadcn
├── tsconfig.json
└── package.json
```

**Decisões-chave:**
- **Server Components** por padrão; Client Components apenas onde há interatividade (mapa, formulários, kanban).
- **Server Actions** para mutações simples; chamadas mais complexas passam pelo **api-client** tipado (contratos gerados a partir do OpenAPI do backend).
- **Zod** para validação de formulários compartilhada entre client/server.
- **TanStack Query** para cache de dados client-side quando necessário (mapa com atualizações frequentes, listas do CRM).

---

## 3. Estrutura de Pastas do Backend (NestJS)

Organização modular por domínio (*Domain Modules*), seguindo convenções NestJS com camadas claras (controller → service → repository).

```
backend/
├── src/
│   ├── main.ts
│   ├── app.module.ts
│   │
│   ├── config/                       # Configuração tipada (ConfigModule + validação Zod/Joi)
│   │   ├── env.validation.ts
│   │   └── configuration.ts
│   │
│   ├── common/                       # Cross-cutting concerns
│   │   ├── decorators/
│   │   ├── filters/                  # Exception filters globais
│   │   ├── guards/                   # AuthGuard, RolesGuard, TenantGuard
│   │   ├── interceptors/             # Logging, timeout, transform
│   │   ├── pipes/                    # Validation pipes
│   │   └── middlewares/
│   │
│   ├── modules/
│   │   ├── auth/
│   │   │   ├── auth.module.ts
│   │   │   ├── auth.controller.ts
│   │   │   ├── auth.service.ts
│   │   │   ├── strategies/           # JWT, Refresh, (futuro: OAuth)
│   │   │   └── dto/
│   │   │
│   │   ├── users/                    # Usuários e permissões dentro do tenant
│   │   ├── tenants/                  # Empresas clientes (multi-tenant)
│   │   │
│   │   ├── companies/                # Construtoras (dados públicos coletados)
│   │   │   ├── companies.module.ts
│   │   │   ├── companies.controller.ts
│   │   │   ├── companies.service.ts
│   │   │   ├── companies.repository.ts
│   │   │   └── dto/
│   │   │
│   │   ├── developments/             # Empreendimentos (lançamento/construção)
│   │   │   ├── developments.module.ts
│   │   │   ├── developments.controller.ts
│   │   │   ├── developments.service.ts
│   │   │   ├── developments.repository.ts
│   │   │   └── dto/
│   │   │
│   │   ├── geo/                      # Busca geoespacial (PostGIS)
│   │   │   ├── geo.module.ts
│   │   │   ├── geo.service.ts        # ST_DWithin, geocoding helpers
│   │   │   └── dto/
│   │   │
│   │   ├── ingestion/                # Coleta/importação de dados externos
│   │   │   ├── ingestion.module.ts
│   │   │   ├── sources/              # Adapters por fonte de dado
│   │   │   │   ├── cnpj-source.ts
│   │   │   │   ├── municipal-alvara-source.ts
│   │   │   │   └── manual-import-source.ts
│   │   │   ├── processors/           # BullMQ processors (workers)
│   │   │   └── ingestion.service.ts
│   │   │
│   │   ├── ai-scoring/                # Módulo de IA
│   │   │   ├── ai-scoring.module.ts
│   │   │   ├── ai-scoring.service.ts
│   │   │   ├── providers/
│   │   │   │   └── openai.provider.ts
│   │   │   ├── prompts/              # Templates de prompt versionados
│   │   │   └── dto/
│   │   │
│   │   ├── leads/                    # CRM - núcleo de oportunidades
│   │   │   ├── leads.module.ts
│   │   │   ├── leads.controller.ts
│   │   │   ├── leads.service.ts
│   │   │   ├── pipeline/             # Estágios, regras de transição
│   │   │   └── dto/
│   │   │
│   │   ├── activities/               # Timeline/histórico de interações do CRM
│   │   ├── notifications/            # E-mail, push, WhatsApp
│   │   ├── billing/                  # Planos, assinatura, limites de uso
│   │   ├── reports/                  # Relatórios e exportações
│   │   └── audit/                    # Auditoria de ações sensíveis
│   │
│   ├── database/
│   │   ├── prisma/
│   │   │   ├── schema.prisma
│   │   │   └── migrations/
│   │   ├── prisma.module.ts
│   │   └── prisma.service.ts
│   │
│   ├── queue/                        # Configuração BullMQ/Redis
│   │   ├── queue.module.ts
│   │   └── queues.constants.ts
│   │
│   └── shared/                       # Tipos, enums e utilitários compartilhados
│
├── test/
│   ├── unit/
│   └── e2e/
│
├── nest-cli.json
├── tsconfig.json
└── package.json
```

**Decisões-chave:**
- **Multi-tenant desde o início** (coluna `tenant_id` em todas as tabelas relevantes + `TenantGuard`), pois é um SaaS B2B — evita retrabalho doloroso depois.
- **Repository pattern** fino sobre o Prisma para isolar queries geoespaciais complexas (raw SQL via `$queryRaw` para PostGIS) do resto da aplicação.
- **BullMQ + Redis** para todo processamento assíncrono (ingestão, scoring em lote, notificações), mantendo a API sempre responsiva.
- Módulo `ai-scoring` isolado com interface de *provider* — permite trocar/adicionar modelos de IA sem tocar no restante do sistema.

---

## 4. Fluxo de Dados da Aplicação

### 4.1 Fluxo — Descoberta de oportunidades (fluxo principal)

1. **Ingestão contínua**: Workers assíncronos (`ingestion` module) coletam periodicamente dados de construtoras e empreendimentos de fontes públicas (prefeituras/alvarás, cartórios de registro, sites de construtoras, CNPJ/Receita Federal) e os normalizam.
2. **Geocodificação**: Cada empreendimento/construtora coletado é geocodificado (Mapbox/Google Geocoding API) e persistido com coordenadas (`geography(Point, 4326)` no PostGIS).
3. **Enriquecimento por IA**: Um job assíncrono envia os dados brutos coletados ao módulo `ai-scoring`, que usa a OpenAI API para: (a) classificar o tipo/porte do empreendimento, (b) estimar a fase da obra, (c) gerar um resumo executivo, (d) calcular um **score de potencial comercial** (0–100) considerando fatores como porte, fase da obra, região, histórico de compras similares.
4. **Persistência do score**: Resultado gravado em `developments.score`, `developments.ai_summary`, com versionamento do prompt/modelo usado (auditoria de IA).
5. **Consulta do usuário**: O usuário define localização + raio no frontend (mapa). O frontend chama a API (`GET /developments/nearby?lat&lng&radius`), que executa uma query PostGIS (`ST_DWithin`) filtrando por tenant, status e score mínimo.
6. **Visualização**: Resultados renderizados no mapa (cluster de pins) e em lista/tabela, ordenáveis por score, distância, data de lançamento.
7. **Conversão em lead**: Usuário marca um empreendimento/construtora como oportunidade → cria-se um registro em `leads`, vinculado ao `tenant_id` e ao usuário responsável, entrando no pipeline do CRM.
8. **Acompanhamento no CRM**: Atualizações de estágio, tarefas, anotações e histórico de interações ficam registradas em `activities`, com notificações automáticas (e-mail/WhatsApp) para follow-ups.
9. **Feedback loop de IA**: Conversões e perdas de leads alimentam métricas que futuramente podem re-treinar/ajustar os prompts e pesos do scoring (melhoria contínua).

### 4.2 Fluxo — Requisição síncrona típica (usuário → dado)

```
Browser (Next.js) 
  → Server Component/Server Action ou fetch client-side 
    → API Gateway (NestJS) [Auth Guard → Tenant Guard → Rate Limit] 
      → Service (regra de negócio) 
        → Repository (Prisma/PostGIS) 
          → PostgreSQL 
        ← retorno
      ← DTO de resposta (mapeado/serializado)
    ← JSON
  ← render/hydrate
```

### 4.3 Fluxo — Processamento assíncrono (IA/ingestão)

```
Scheduler (Cron) ou Trigger manual
  → Job enfileirado (BullMQ) 
    → Worker consome job 
      → Chama fonte externa / OpenAI API 
        → Normaliza/valida payload 
          → Persiste no PostgreSQL 
            → Emite evento interno (ex: "development.scored") 
              → Notification Service (se aplicável) 
              → WebSocket push para frontend (atualização em tempo real, opcional)
```

---

## 5. Módulos Necessários

### Backend
1. **Auth & Identity** — autenticação (JWT + refresh token), RBAC, convites de equipe.
2. **Tenants** — gestão de empresas clientes do SaaS (multi-tenancy).
3. **Companies (Construtoras)** — cadastro e dados públicos de construtoras.
4. **Developments (Empreendimentos)** — empreendimentos vinculados às construtoras, com status (lançamento/fundação/estrutura/acabamento/entregue).
5. **Geo** — busca por raio, geocodificação, cálculo de distância, clustering.
6. **Ingestion** — orquestração de coleta de dados externos (scraping ético/APIs/importação manual).
7. **AI Scoring & Enrichment** — integração OpenAI, geração de score, resumo e classificação.
8. **Leads / CRM Core** — pipeline de oportunidades, estágios, funil.
9. **Activities/Timeline** — histórico de interações, tarefas, follow-ups.
10. **Notifications** — e-mail, push, WhatsApp (Business API), lembretes.
11. **Billing** — planos, limites de uso, integração com gateway de pagamento.
12. **Reports/Analytics** — dashboards, exportação (CSV/PDF), métricas de funil.
13. **Audit Log** — rastreabilidade de ações sensíveis (LGPD).
14. **Admin/Backoffice** (interno) — gestão de tenants, monitoramento de qualidade de dados coletados.

### Frontend
1. **Autenticação** (login, registro, recuperação de senha, convite de equipe).
2. **Radar/Mapa** — busca geoespacial interativa.
3. **Construtoras** — listagem e perfil detalhado.
4. **Empreendimentos** — listagem, detalhe, score de IA, timeline da obra.
5. **CRM/Leads** — kanban de pipeline, detalhe de lead, tarefas.
6. **Relatórios** — dashboards e exportações.
7. **Configurações** — equipe, permissões, integrações, plano/cobrança.
8. **Notificações** — central de notificações in-app.

---

## 6. Integrações Externas Necessárias

| Categoria | Serviço | Finalidade |
|---|---|---|
| **Mapas/Geo** | Mapbox ou Google Maps API | Mapa interativo, geocodificação, cálculo de distância/raio |
| **IA** | OpenAI API | Scoring, classificação, resumo, enriquecimento de texto |
| **Dados públicos/registro** | APIs municipais de alvará de construção (quando disponíveis), Receita Federal (validação de CNPJ), Juntas Comerciais | Identificação de construtoras e obras |
| **CEP/Endereço** | ViaCEP ou similar | Normalização de endereços nacionais |
| **Comunicação** | Provedor de e-mail transacional (SES, Resend, SendGrid) | Notificações, onboarding |
| **Comunicação** | WhatsApp Business API (Twilio/Meta Cloud API) | Alertas de leads e follow-up comercial |
| **Pagamentos** | Stripe (internacional) ou gateway nacional (Pagar.me/Iugu) | Assinatura SaaS, cobrança recorrente |
| **Observabilidade** | Sentry (erros), Datadog/Grafana+Prometheus (métricas/logs) | Monitoramento e alertas |
| **Armazenamento** | S3-compatible (AWS S3 ou Cloudflare R2) | Documentos, anexos de leads, exports |
| **Autenticação social (opcional)** | Google OAuth | Login simplificado |

---

## 7. Estratégia de Escalabilidade

1. **Stateless API**: Instâncias NestJS sem estado em memória — sessão/cache em Redis — permite escalonamento horizontal simples atrás de um load balancer.
2. **Separação de cargas de trabalho**: Processos síncronos (API) e assíncronos (ingestão/IA/notificações) rodam em processos/serviços distintos (ex.: containers separados para *API* e *Workers*), evitando que scraping/IA pesada degrade a latência da API.
3. **Filas com backpressure**: BullMQ com limites de concorrência e retry/backoff exponencial para chamadas à OpenAI API e fontes externas, evitando estouro de custo e rate-limit.
4. **Banco de dados**:
   - Índices geoespaciais (GiST via PostGIS) nas colunas de localização.
   - Read replicas para consultas pesadas de relatórios/mapa conforme a base cresce.
   - Particionamento futuro por `tenant_id` ou por região, se necessário.
5. **Cache em camadas**: Redis para resultados de busca geoespacial frequentes (ex.: mesma região consultada por vários usuários), com invalidação por TTL curto + invalidação ativa quando novos dados de IA chegam.
6. **CDN**: Assets estáticos do Next.js e imagens servidos via CDN (Vercel Edge Network ou CloudFront).
7. **Multi-tenancy eficiente**: Estratégia *shared database, shared schema* com `tenant_id` no MVP (custo baixo); caminho de evolução para *schema-per-tenant* ou banco dedicado para tenants enterprise, se necessário.
8. **Custo de IA controlado**: Cache de resultados de scoring (não reprocessar o mesmo empreendimento sem mudança de dados), uso de modelos menores para classificação simples e modelos maiores só quando necessário (estratégia de *model tiering*).
9. **Autoscaling de infraestrutura**: Containers orquestrados (ECS/Kubernetes) com autoscaling baseado em CPU/fila de jobs pendentes.
10. **Observabilidade orientada a SLOs**: Métricas de latência de API, taxa de erro, tempo de processamento de filas e custo por chamada de IA monitorados continuamente para antecipar gargalos.

---

## 8. Estratégia de Segurança

1. **Autenticação e autorização**:
   - JWT de curta duração + refresh token com rotação.
   - RBAC por tenant (papéis: Admin, Gestor Comercial, Vendedor).
   - `TenantGuard` global garantindo isolamento de dados entre clientes (nenhuma query cruza `tenant_id` sem autorização explícita — importante em ambiente multi-tenant).
2. **Proteção de dados (LGPD)**:
   - Dados pessoais de leads/contatos tratados como dados sensíveis: criptografia em repouso (at-rest encryption no banco/storage) e em trânsito (TLS 1.2+ em todas as conexões).
   - Política de retenção e exclusão de dados configurável por tenant.
   - Log de auditoria (`audit` module) para acesso e alteração de dados sensíveis.
   - Base legal e consentimento documentados para dados coletados de fontes públicas.
3. **Segurança de API**:
   - Validação estrita de entrada (class-validator/Zod) em todos os endpoints.
   - Rate limiting e throttling por tenant/IP (NestJS Throttler + Redis).
   - Proteção contra OWASP Top 10: sanitização contra SQL Injection (Prisma parametrizado), XSS (CSP + sanitização de output no frontend), CSRF (tokens em formulários sensíveis/SameSite cookies), SSRF (validação de URLs em módulos de ingestão que buscam conteúdo externo).
   - Segredos (API keys da OpenAI, Mapbox, etc.) geridos via secret manager (AWS Secrets Manager/Doppler), nunca em código ou repositório.
4. **Segurança de infraestrutura**:
   - Rede segmentada (VPC), banco de dados sem exposição pública direta, acesso via bastion/VPN quando necessário.
   - Backups automáticos e criptografados do PostgreSQL, com testes periódicos de restauração.
   - WAF/CDN na borda para mitigar abuso e bots no scraping reverso (proteção da própria plataforma).
5. **Segurança da camada de IA**:
   - Sanitização de prompts para evitar *prompt injection* via dados coletados de fontes externas não confiáveis.
   - Limitação do que a IA pode "decidir" de forma autônoma (scoring é sempre revisável/editável por humano — *human-in-the-loop*).
   - Não envio de dados pessoais desnecessários para a API da OpenAI (minimização de dados).
6. **Compliance de scraping/coleta**:
   - Respeito a `robots.txt` e termos de uso das fontes; priorização de fontes com API pública oficial sobre scraping direto.
   - Rastreabilidade da origem de cada dado coletado (proveniência), permitindo remoção sob solicitação.

---

## 9. Modelo Inicial de Infraestrutura

### 9.1 Ambientes
- **Development**: local (Docker Compose) — Postgres+PostGIS, Redis, backend e frontend em containers.
- **Staging**: réplica reduzida da produção para validação antes do deploy.
- **Production**: infraestrutura gerenciada com alta disponibilidade.

### 9.2 Proposta de topologia (cloud-agnostic, com exemplo AWS)

```
┌────────────────────────────────────────────────────────────────┐
│                            Internet                             │
└───────────────┬──────────────────────────────┬──────────────────┘
                │                              │
       ┌────────▼────────┐            ┌────────▼────────┐
       │  Vercel / CDN     │            │   CloudFront/WAF │
       │  (Frontend Next)  │            │  (se front custom)│
       └───────────────────┘            └────────┬────────┘
                                                  │
                                        ┌─────────▼─────────┐
                                        │  Load Balancer (ALB)│
                                        └─────────┬─────────┘
                                                  │
                          ┌───────────────────────┼───────────────────────┐
                          │                       │                       │
                 ┌────────▼────────┐    ┌─────────▼─────────┐   ┌─────────▼────────┐
                 │  API (NestJS)     │    │  Workers (BullMQ)  │   │  Admin/Backoffice │
                 │  containers (ECS/  │    │  containers (ECS/  │   │  (opcional)        │
                 │  Fargate/K8s)      │    │  Fargate/K8s)      │   └───────────────────┘
                 └────────┬──────────┘    └─────────┬─────────┘
                          │                          │
              ┌───────────┴───────────┐              │
              │                       │              │
     ┌────────▼────────┐    ┌─────────▼────────┐    ┌▼─────────────┐
     │ PostgreSQL+PostGIS│   │  Redis (cache/fila)│   │  S3 / R2      │
     │ (RDS gerenciado,  │   │  (ElastiCache)     │   │  (documentos, │
     │  com read replica) │   └────────────────────┘   │   exports)    │
     └────────────────────┘                             └───────────────┘

     Observabilidade: Sentry (erros) · Prometheus/Grafana ou Datadog (métricas/logs)
     Secrets: AWS Secrets Manager / Doppler
     CI/CD: GitHub Actions → build/test/deploy (staging → produção com aprovação manual)
```

### 9.3 Componentes de infraestrutura recomendados (MVP)

| Camada | Opção recomendada (MVP) | Caminho de evolução |
|---|---|---|
| Frontend hosting | Vercel (nativo para Next.js) | Multi-região / CDN dedicado |
| Backend hosting | Container único (Fly.io/Railway/ECS Fargate) | Kubernetes com autoscaling |
| Banco de dados | PostgreSQL gerenciado com extensão PostGIS (RDS/Supabase/Neon) | Read replicas, particionamento |
| Cache/Filas | Redis gerenciado (ElastiCache/Upstash) | Cluster Redis |
| Storage | S3/Cloudflare R2 | Multi-região |
| CI/CD | GitHub Actions | Pipelines com canary/blue-green |
| Observabilidade | Sentry + logs estruturados (Pino) | Stack completa APM |

### 9.4 Estimativa de esforço por fase (referência de planejamento)

| Fase | Escopo | Observação |
|---|---|---|
| Fase 0 | Setup de infraestrutura, CI/CD, schema base | Fundação técnica |
| Fase 1 | Auth + multi-tenancy + módulo Companies/Developments + Geo | MVP funcional de busca |
| Fase 2 | Módulo de Ingestão (fontes iniciais) + Módulo IA (scoring) | Diferencial competitivo |
| Fase 3 | CRM completo (leads, pipeline, activities, notificações) | Fechamento do loop comercial |
| Fase 4 | Billing, relatórios, hardening de segurança, observabilidade | Preparação para produção/escala |

---

## Próximos Passos

Este documento cobre o planejamento solicitado (arquitetura, estrutura de pastas, fluxo de dados, módulos, integrações, escalabilidade, segurança e infraestrutura). Antes de avançar para a implementação (Parte 2), recomenda-se validar:

1. Escolha definitiva entre **Mapbox** e **Google Maps API** (custo, cobertura de dados no Brasil, limites de geocodificação).
2. Fontes de dados de construtoras/empreendimentos disponíveis por região de atuação inicial (definir MVP de ingestão).
3. Modelo de precificação do SaaS (planos, limites, métricas de billing).
4. Provedor de hospedagem definitivo (AWS vs. Vercel+Neon/Supabase vs. outro) conforme orçamento e equipe disponível.

Após validação desses pontos, seguimos para a Parte 2: modelagem de dados detalhada (schema Prisma) e especificação de contratos de API.
