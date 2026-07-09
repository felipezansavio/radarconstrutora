# Radar Construtora IA — Segurança, Permissões e Auditoria (Parte 12)

> Documenta a camada de segurança implementada para operar a plataforma como um SaaS comercial multiempresa. Complementa `docs/architecture.md`.

---

## 1. Autenticação e proteção de sessão

- **JWT access token** (15 min por padrão, `JWT_ACCESS_TOKEN_TTL`) + **refresh token** (7 dias, `JWT_REFRESH_TOKEN_TTL`), assinados com segredos independentes.
- O refresh token nunca é armazenado em texto puro: só o hash SHA-256 fica no banco (`refresh_tokens.token_hash`).
- **Rotação**: cada `POST /api/v1/auth/refresh` revoga o token usado e emite um par novo.
- **Reuso de token detectado = roubo de sessão assumido**: se um refresh token já revogado for apresentado novamente, todas as sessões do usuário são revogadas imediatamente (`AuthService.refresh`).
- **Logout**: `POST /auth/logout` revoga a sessão atual; `POST /auth/logout-all` revoga todas as sessões do usuário (todos os dispositivos) — útil após suspeita de comprometimento.
- Sessões são forçadas a expirar quando:
  - o e-mail/senha estão incorretos ou a conta foi removida (soft delete) — login rejeitado;
  - o perfil (role) de um usuário é alterado por um admin — todos os refresh tokens dele são revogados;
  - um usuário é removido — todos os seus refresh tokens são revogados.
- **Senhas**: hash com bcrypt, 12 rounds (`BCRYPT_SALT_ROUNDS`, `common/constants/security.constants.ts`). Nunca armazenadas nem retornadas em texto puro.
- **Força de senha**: `RegisterDto`/`CreateUserDto` exigem mínimo de 8 caracteres com letra maiúscula, minúscula e número (`@IsStrongPassword`), com limite máximo de 72 caracteres (bcrypt trunca silenciosamente entradas maiores).
- **Força bruta no login**: `LoginThrottleMiddleware` bloqueia por 15 minutos após 5 tentativas malsucedidas (IP + e-mail), usando Redis para funcionar entre múltiplas instâncias da API.
- **Registro de conta**: limitado a 5 requisições/minuto por IP (`@Throttle`) para dificultar criação em massa de tenants.

## 2. Controle de permissões (RBAC)

Perfis: `ADMIN`, `GESTOR`, `VENDEDOR` (`UserRole`). Aplicado via `@Roles()` + `RolesGuard` (global) e, quando a regra depende do **dono do registro** (não só do perfil), via checagem no service:

| Recurso | ADMIN | GESTOR | VENDEDOR |
|---|---|---|---|
| Usuários: listar/ver | ✓ | ✓ | ✗ |
| Usuários: criar | ✓ | ✗ | ✗ |
| Usuários: remover | ✓ | ✗ | ✗ |
| Leads: ver/editar | todos os da empresa | todos os da empresa | **somente os próprios** |
| Leads: reatribuir dono | ✓ | ✓ | ✗ (só pode criar leads para si mesmo) |
| Tarefas: ver/editar | todas | todas | **somente as atribuídas a si** |
| Interações de CRM | todas | todas | **somente dos leads próprios** |
| Construtoras/empreendimentos: criar/editar | ✓ | ✓ | ✗ (leitura permitida) |
| Construtoras/empreendimentos: remover | ✓ | ✗ | ✗ |
| Monitoramento de oportunidades (scan manual) | ✓ | ✓ | ✗ |
| Ingestão externa (fontes pagas) | ✓ | ✓ | ✗ |
| Auditoria (`/audit-logs`) | ✓ | ✗ | ✗ |

Exemplo prático: um vendedor autenticado que tenta abrir `GET /leads/:id` de um lead de outro vendedor recebe `403 Forbidden` (`LeadsService.assertCanAccessLead`); o mesmo vale para tarefas (`TasksService.assertCanAccessTask`) e interações de CRM (`CrmService.assertLeadBelongsToTenant`). Filtros de listagem (`ownerId`/`assigneeId`) informados na query são **sobrescritos** para o próprio usuário quando o perfil não tem visão completa — não é possível contornar via parâmetro de busca.

## 3. Multi-tenancy (multiempresa)

- Toda tabela com dado específico de uma empresa carrega `tenant_id` (`users`, `leads`, `tasks`, `notifications`, `searches`, `ai_interactions`, `audit_logs`).
- Toda query de listagem filtra por `tenantId = currentUser.tenantId`; toda busca por id confere o `tenantId` do registro contra o usuário autenticado antes de retornar (`NotFoundException` se não bater — não revela a existência do recurso para outra empresa).
- `Company`/`Development` (dados de prospecção — construtoras e empreendimentos) são **catálogo compartilhado** entre todas as empresas clientes por desenho (a mesma construtora pode ser prospectada por múltiplos clientes do SaaS); não carregam `tenant_id`.
- O middleware/guard de autenticação (`JwtStrategy`) resolve `tenantId` a partir do usuário autenticado a cada requisição — não é um valor confiável vindo do cliente.

## 4. Segurança do banco de dados

- Prisma ORM parametriza todas as queries (proteção nativa contra SQL Injection); as poucas consultas geográficas usam `$queryRaw` com `Prisma.sql`/`Prisma.join` (interpolação seguro, nunca concatenação de string).
- Chaves estrangeiras e índices em todas as relações e nos campos mais consultados (`tenantId`, `tenantId+status`, `entity+entityId` em auditoria, etc.).
- **Soft delete** (`deleted_at`) em `users`, `companies`, `developments` e `tasks` — remover nunca apaga o registro, só marca `deletedAt`. Todas as consultas de leitura (inclusive as buscas geográficas via SQL raw) filtram `deleted_at IS NULL`. Isso preserva o histórico de CRM/auditoria mesmo após a remoção de um cadastro.
- E-mail (usuários) e CNPJ (construtoras) continuam únicos no banco mesmo após a exclusão lógica — a checagem de duplicidade no cadastro considera registros removidos para não estourar erro de constraint.

## 5. Validação de dados

- `ValidationPipe` global com `whitelist: true` + `forbidNonWhitelisted: true` + `transform: true` — qualquer campo não declarado no DTO é rejeitado (`400`), payloads são convertidos para os tipos esperados antes de chegar no service.
- E-mail: `@IsEmail()`. Senha forte: `@IsStrongPassword()` + `@MaxLength(72)`. CNPJ: `@IsCnpj()` (formato + dígitos verificadores, `common/validators/is-cnpj.decorator.ts`). Coordenadas: `@IsLatitude()`/`@IsLongitude()`. Enums (status de lead, tipo de imóvel, etc.): `@IsEnum()`.
- Sanitização por construção: como o Prisma nunca interpola valores de usuário diretamente em SQL, não há vetor de injeção via os campos de texto livre (notas de lead, mensagens de interação, etc.).

## 6. Proteção contra ataques

- **Rate limit**: `ThrottlerModule` global (100 req/60s por IP, configurável via `THROTTLE_TTL`/`THROTTLE_LIMIT`), com limites mais estritos em rotas sensíveis/custosas:
  - `POST /auth/register`: 5/min;
  - `POST /auth/login`: bloqueio dedicado por Redis (5 tentativas malsucedidas/15 min), além do limite global;
  - `/ai/*` (chamadas à OpenAI): 20/min;
  - `/ingestion/discover` (provedores externos pagos): 10/min.
- **CORS**: lista de origens permitidas via `CORS_ORIGIN` (aceita múltiplas, separadas por vírgula), métodos explícitos (`GET,POST,PATCH,DELETE,OPTIONS`), `credentials: true`.
- **Helmet**: headers de segurança padrão (`X-Content-Type-Options`, `X-Frame-Options`, `Strict-Transport-Security`, etc.) em todas as respostas.
- **CSRF**: mitigado pelo modelo de autenticação (Bearer token em header, não cookie de sessão — CSRF explora cookies enviados automaticamente pelo navegador, o que não se aplica aqui).
- **Credential stuffing/brute force**: coberto pelo throttle de login acima; senhas fortes reduzem a superfície de ataque de dicionário.

## 7. Auditoria do sistema

Tabela `audit_logs` (`id`, `tenant_id`, `user_id`, `action`, `entity`, `entity_id`, `old_value`, `new_value`, `ip_address`, `user_agent`, `created_at`), exposta (somente leitura, só para `ADMIN`) em `GET /audit-logs` com paginação e filtros por `entity`/`action`/`userId`.

Eventos registrados hoje:

- **Autenticação**: `LOGIN`, `LOGIN_FAILED` (com IP e user-agent), `LOGOUT`, `LOGOUT_ALL`.
- **Usuários**: `USER_CREATED`, `USER_ROLE_CHANGED` (valor antigo/novo do perfil), `USER_DELETED`.
- **Leads**: `LEAD_CREATED`, `LEAD_STATUS_CHANGED` (status antigo/novo), `LEAD_REASSIGNED` (dono antigo/novo).
- **Tarefas**: `TASK_CREATED`, `TASK_UPDATED`, `TASK_DELETED`.

Gravar um log de auditoria nunca derruba a operação que o originou — falhas de gravação só aparecem no log de aplicação (`AuditService.record` captura e loga o erro internamente).

## 8. Logs da aplicação

- `nestjs-pino` (Pino) como logger estruturado, com formatação legível em desenvolvimento (`pino-pretty`) e JSON em produção.
- **Correlação de requisições**: cada requisição recebe um id (`genReqId`, reaproveitando `X-Request-Id` se o cliente já enviar um) devolvido no header de resposta — permite rastrear um erro relatado pelo usuário até a linha de log correspondente.
- **Redação de dados sensíveis nos logs**: headers `Authorization` e `Cookie` nunca são logados (`redact` no `pinoHttp`).
- Erros 5xx são logados com stack trace via `HttpExceptionFilter`; erros de negócio (4xx) não geram log de erro (evita ruído).
- **Integração futura preparada**: variáveis `SENTRY_DSN`/`DATADOG_API_KEY` documentadas em `backend/.env.example` (comentadas) — a estrutura de logs já em JSON facilita a ingestão por Sentry/Datadog/CloudWatch quando o provedor for contratado; não adicionamos a dependência do SDK ainda para não acoplar a um provedor específico antes da decisão de produto.

## 9. Segurança da API

- **Versionamento**: toda a API fica sob `/api/v1` (`app.enableVersioning({ type: URI, defaultVersion: '1' })`). `GET /api` e `GET /api/health` ficam fora do versionamento (`VERSION_NEUTRAL`) para uso por load balancers/orquestradores.
- **Swagger protegido**: em produção, `/api/docs` só é montado se `SWAGGER_USER`/`SWAGGER_PASSWORD` estiverem configurados (autenticação básica); fora de produção fica aberto por conveniência de desenvolvimento.
- **Paginação**: toda listagem (`leads`, `tasks` via filtro, `builders`, `projects`, `audit-logs`) aceita `page`/`pageSize` com teto de 100 itens por página — evita respostas não limitadas.
- **Nunca retornamos**: hash de senha (DTOs de resposta fazem whitelist explícito dos campos, ex. `UserResponseDto`), refresh/access tokens em endpoints que não sejam os de auth, ou detalhes internos de erro 500 (mensagem genérica ao cliente, stack trace só no log do servidor).

## 10. Proteção de dados sensíveis

- Chaves de API (OpenAI, Google Maps/Places, SMTP, WhatsApp) só existem como variáveis de ambiente (`backend/.env`, nunca commitado — `.gitignore`); nenhum endpoint as expõe.
- Nenhuma resposta de API inclui `passwordHash`, `tokenHash` ou segredos de configuração.
- Cabeçalhos de autorização e cookies são redigidos dos logs (seção 8).
- **Secret Manager**: não usado ainda (single-tenant de infraestrutura, variáveis de ambiente são suficientes no estágio atual) — documentado aqui como próximo passo natural ao migrar para múltiplos ambientes/regiões (AWS Secrets Manager, GCP Secret Manager ou Doppler).

## 11. Backup e recuperação

- `scripts/backup-db.sh`: gera um dump lógico (`pg_dump --format=custom`) com timestamp, aplica retenção configurável (`RETENTION_DAYS`, padrão 30 dias). Lê `DATABASE_URL` do ambiente ou de `backend/.env`.
- `scripts/restore-db.sh`: restaura um dump (`pg_restore --clean --if-exists`) com confirmação interativa antes de sobrescrever o destino.
- **Recomendação de produção**: agendar `backup-db.sh` via cron diário (madrugada, baixo tráfego) e enviar o dump para armazenamento externo (S3/GCS) com política de ciclo de vida — ou, preferencialmente, usar os snapshots automáticos do provedor de Postgres gerenciado (RDS, Neon, Supabase) como fonte primária de recuperação, mantendo o script como plano B portátil.
- **Procedimento de recuperação de desastre**:
  1. Provisionar um novo banco Postgres 16 com a extensão PostGIS instalada.
  2. Definir `DATABASE_URL` apontando para o banco novo.
  3. Rodar `./scripts/restore-db.sh <dump>`.
  4. Rodar `npm run prisma:generate --prefix backend` e validar com `npm run prisma:migrate --prefix backend` que não há migrations pendentes além do dump restaurado.
  5. Apontar a aplicação (`backend/.env`) para o banco restaurado e reiniciar.

## 12. Testes de segurança

Ver `backend/src/common/guards/roles.guard.spec.ts`, `backend/src/modules/leads/leads.service.spec.ts`, `backend/src/modules/tasks/tasks.service.spec.ts`, `backend/src/modules/auth/auth.service.spec.ts` e `backend/test/security.e2e-spec.ts`. Cobrem:

- Matriz de perfis do `RolesGuard` (rota sem `@Roles` libera qualquer perfil; rota com `@Roles` bloqueia perfil fora da lista).
- Vendedor não acessa/edita lead ou tarefa de outro vendedor; só admin/gestor reatribuem.
- Reuso de refresh token já revogado derruba todas as sessões do usuário.
- Isolamento entre empresas: usuário da empresa A recebe 404 ao tentar acessar lead da empresa B (via API real, ponta a ponta).
- Perfil comum tentando `DELETE /users/:id` (ação administrativa) recebe 403.
- Payload inválido (e-mail malformado, senha fraca, enum fora da lista) é rejeitado com 400 antes de chegar à camada de negócio.

## 13. Checklist final de segurança

- [x] Senhas criptografadas (bcrypt, 12 rounds)
- [x] JWT funcionando (access + refresh, segredos independentes)
- [x] Refresh token seguro (hash armazenado, rotação, detecção de reuso, logout-all)
- [x] Permissões funcionando (RBAC por perfil + escopo por dono do registro)
- [x] Multiempresa isolada (tenant_id + verificação em toda leitura/escrita)
- [x] APIs protegidas (guards globais, versionamento, rate limit por rota sensível)
- [x] Banco protegido (Prisma parametrizado, índices, soft delete)
- [x] Logs funcionando (Pino estruturado, correlação por request-id, redação de segredos)
- [x] Auditoria ativa (login, alterações de usuário/lead/tarefa)
- [x] Dados sensíveis protegidos (nunca retornar hash/token, variáveis de ambiente para chaves)
- [x] Backups configurados (scripts testados + procedimento de restore documentado)
