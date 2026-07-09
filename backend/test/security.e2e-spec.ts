import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';

interface AuthResponseBody {
  accessToken: string;
  refreshToken: string;
  user: { id: string; email: string; role: string; tenantId: string };
}

interface CreatedUserBody {
  id: string;
  name: string;
  email: string;
  role: string;
}

/**
 * Testes de segurança de ponta a ponta (Parte 12): isolamento entre
 * empresas (multi-tenancy), RBAC baseado em perfil/dono do registro, e
 * rejeição de payloads inválidos — rodando contra a aplicação real e o
 * banco de desenvolvimento.
 */
jest.setTimeout(30_000);

describe('Segurança (e2e)', () => {
  let app: INestApplication<App>;
  const runId = Date.now();

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  async function registerTenant(label: string): Promise<AuthResponseBody> {
    const email = `admin-${label}-${runId}@empresa.com`;
    const res = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        name: `Admin ${label}`,
        email,
        password: 'SenhaForte123',
        companyName: `Empresa ${label} ${runId}`,
      })
      .expect(201);

    return res.body as AuthResponseBody;
  }

  async function createVendedor(
    adminToken: string,
    label: string,
  ): Promise<AuthResponseBody & { id: string }> {
    const email = `vendedor-${label}-${runId}@empresa.com`;
    const res = await request(app.getHttpServer())
      .post('/users')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: `Vendedor ${label}`,
        email,
        password: 'SenhaForte123',
        role: 'VENDEDOR',
      })
      .expect(201);
    const created = res.body as CreatedUserBody;

    const login = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email, password: 'SenhaForte123' })
      .expect(200);

    return { id: created.id, ...(login.body as AuthResponseBody) };
  }

  describe('Isolamento entre empresas (multi-tenancy)', () => {
    it('uma empresa nunca acessa lead de outra empresa', async () => {
      const tenantA = await registerTenant('A');
      const tenantB = await registerTenant('B');

      const builder = await request(app.getHttpServer())
        .post('/builders')
        .set('Authorization', `Bearer ${tenantA.accessToken}`)
        .send({ name: `Construtora Teste ${runId}` })
        .expect(201);

      const lead = await request(app.getHttpServer())
        .post('/leads')
        .set('Authorization', `Bearer ${tenantA.accessToken}`)
        .send({ companyId: (builder.body as { id: string }).id })
        .expect(201);

      const leadId = (lead.body as { id: string }).id;

      await request(app.getHttpServer())
        .get(`/leads/${leadId}`)
        .set('Authorization', `Bearer ${tenantB.accessToken}`)
        .expect(404);

      // A própria empresa continua enxergando o lead normalmente.
      await request(app.getHttpServer())
        .get(`/leads/${leadId}`)
        .set('Authorization', `Bearer ${tenantA.accessToken}`)
        .expect(200);
    });
  });

  describe('RBAC — permissão por perfil e por dono do registro', () => {
    it('um vendedor não acessa lead de outro vendedor da mesma empresa', async () => {
      const tenant = await registerTenant('C');
      const builder = await request(app.getHttpServer())
        .post('/builders')
        .set('Authorization', `Bearer ${tenant.accessToken}`)
        .send({ name: `Construtora RBAC ${runId}` })
        .expect(201);

      const vendedor1 = await createVendedor(tenant.accessToken, 'C1');
      const vendedor2 = await createVendedor(tenant.accessToken, 'C2');

      const lead = await request(app.getHttpServer())
        .post('/leads')
        .set('Authorization', `Bearer ${tenant.accessToken}`)
        .send({
          companyId: (builder.body as { id: string }).id,
          ownerId: vendedor2.id,
        })
        .expect(201);

      const leadId = (lead.body as { id: string }).id;

      await request(app.getHttpServer())
        .get(`/leads/${leadId}`)
        .set('Authorization', `Bearer ${vendedor1.accessToken}`)
        .expect(403);

      await request(app.getHttpServer())
        .get(`/leads/${leadId}`)
        .set('Authorization', `Bearer ${vendedor2.accessToken}`)
        .expect(200);
    });

    it('um vendedor não consegue remover usuários (ação restrita a admin)', async () => {
      const tenant = await registerTenant('D');
      const vendedor = await createVendedor(tenant.accessToken, 'D1');
      const otherVendedor = await createVendedor(tenant.accessToken, 'D2');

      await request(app.getHttpServer())
        .delete(`/users/${otherVendedor.id}`)
        .set('Authorization', `Bearer ${vendedor.accessToken}`)
        .expect(403);
    });

    it('um vendedor não consegue listar todos os usuários da empresa', async () => {
      const tenant = await registerTenant('E');
      const vendedor = await createVendedor(tenant.accessToken, 'E1');

      await request(app.getHttpServer())
        .get('/users')
        .set('Authorization', `Bearer ${vendedor.accessToken}`)
        .expect(403);
    });
  });

  describe('Validação de payloads inválidos', () => {
    it('rejeita cadastro com senha fraca', async () => {
      await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          name: 'Teste Senha Fraca',
          email: `senha-fraca-${runId}@empresa.com`,
          password: '12345678',
          companyName: 'Empresa Senha Fraca',
        })
        .expect(400);
    });

    it('rejeita cadastro com e-mail malformado', async () => {
      await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          name: 'Teste Email Invalido',
          email: 'nao-e-um-email',
          password: 'SenhaForte123',
          companyName: 'Empresa Email Invalido',
        })
        .expect(400);
    });

    it('rejeita campos não declarados no DTO (whitelist)', async () => {
      const tenant = await registerTenant('F');

      await request(app.getHttpServer())
        .post('/builders')
        .set('Authorization', `Bearer ${tenant.accessToken}`)
        .send({ name: 'Construtora X', isAdmin: true })
        .expect(400);
    });
  });

  describe('Autenticação', () => {
    it('rejeita acesso sem token', async () => {
      await request(app.getHttpServer()).get('/leads').expect(401);
    });

    it('rejeita token adulterado', async () => {
      const tenant = await registerTenant('G');
      const tampered = `${tenant.accessToken.slice(0, -2)}xx`;

      await request(app.getHttpServer())
        .get('/leads')
        .set('Authorization', `Bearer ${tampered}`)
        .expect(401);
    });

    it('detecta reuso de refresh token e revoga a sessão', async () => {
      const tenant = await registerTenant('H');

      const firstRefresh = await request(app.getHttpServer())
        .post('/auth/refresh')
        .send({ refreshToken: tenant.refreshToken })
        .expect(200);
      const rotated = firstRefresh.body as AuthResponseBody;

      // Reapresentar o token já rotacionado deve falhar...
      await request(app.getHttpServer())
        .post('/auth/refresh')
        .send({ refreshToken: tenant.refreshToken })
        .expect(401);

      // ...e a sessão gerada pela rotação anterior também é revogada.
      await request(app.getHttpServer())
        .post('/auth/refresh')
        .send({ refreshToken: rotated.refreshToken })
        .expect(401);
    });
  });
});
