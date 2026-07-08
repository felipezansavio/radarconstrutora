import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

const DEFAULT_PASSWORD = 'ChangeMe123!';

async function main() {
  const passwordHash = await bcrypt.hash(DEFAULT_PASSWORD, 10);

  const tenant = await prisma.tenant.upsert({
    where: { id: '00000000-0000-0000-0000-000000000001' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000001',
      name: 'Esquadrias Silva',
      segment: 'Esquadrias de alumínio e vidro',
      email: 'contato@esquadriasilva.com.br',
      phone: '+55 11 4000-1000',
      website: 'https://esquadriasilva.com.br',
    },
  });

  const [admin, manager, salesRep] = await Promise.all([
    prisma.user.upsert({
      where: { email: 'ana@esquadriasilva.com.br' },
      update: {},
      create: {
        name: 'Ana Diretoria',
        email: 'ana@esquadriasilva.com.br',
        passwordHash,
        role: 'ADMIN',
        tenantId: tenant.id,
      },
    }),
    prisma.user.upsert({
      where: { email: 'bruno@esquadriasilva.com.br' },
      update: {},
      create: {
        name: 'Bruno Gestor',
        email: 'bruno@esquadriasilva.com.br',
        passwordHash,
        role: 'GESTOR',
        tenantId: tenant.id,
      },
    }),
    prisma.user.upsert({
      where: { email: 'carla@esquadriasilva.com.br' },
      update: {},
      create: {
        name: 'Carla Vendas',
        email: 'carla@esquadriasilva.com.br',
        passwordHash,
        role: 'VENDEDOR',
        tenantId: tenant.id,
      },
    }),
  ]);

  // Construtoras (dados fictícios), com coordenadas reais de bairros de
  // São Paulo, para permitir testar a busca por raio de ponta a ponta.
  const companiesData = [
    {
      id: '00000000-0000-0000-0000-000000000101',
      name: 'Construtora Horizonte Ltda',
      cnpj: '11.111.111/0001-11',
      phone: '+55 11 3000-1111',
      email: 'contato@horizonte.com.br',
      website: 'https://horizonte.com.br',
      socialLinks: { instagram: '@construtorahorizonte' },
      neighborhood: 'Pinheiros',
      city: 'São Paulo',
      state: 'SP',
      zipCode: '05422-000',
      latitude: -23.5629,
      longitude: -46.6825,
    },
    {
      id: '00000000-0000-0000-0000-000000000102',
      name: 'Incorporadora Vale Verde',
      cnpj: '22.222.222/0001-22',
      phone: '+55 11 3000-2222',
      email: 'contato@valeverde.com.br',
      website: 'https://valeverde.com.br',
      socialLinks: { instagram: '@valeverdeincorporadora' },
      neighborhood: 'Vila Mariana',
      city: 'São Paulo',
      state: 'SP',
      zipCode: '04101-000',
      latitude: -23.5875,
      longitude: -46.6388,
    },
    {
      id: '00000000-0000-0000-0000-000000000103',
      name: 'Construtora Nova Aurora',
      cnpj: '33.333.333/0001-33',
      phone: '+55 11 3000-3333',
      email: 'contato@novaaurora.com.br',
      website: 'https://novaaurora.com.br',
      socialLinks: { instagram: '@novaaurorasp' },
      neighborhood: 'Moema',
      city: 'São Paulo',
      state: 'SP',
      zipCode: '04077-000',
      latitude: -23.6003,
      longitude: -46.665,
    },
    {
      id: '00000000-0000-0000-0000-000000000104',
      name: 'Edificar Empreendimentos',
      cnpj: '44.444.444/0001-44',
      phone: '+55 11 3000-4444',
      email: 'contato@edificar.com.br',
      website: 'https://edificar.com.br',
      socialLinks: { instagram: '@edificarempreendimentos' },
      neighborhood: 'Tatuapé',
      city: 'São Paulo',
      state: 'SP',
      zipCode: '03310-000',
      latitude: -23.5405,
      longitude: -46.5765,
    },
    {
      id: '00000000-0000-0000-0000-000000000105',
      name: 'Construtora Santo Amaro',
      cnpj: '55.555.555/0001-55',
      phone: '+55 11 3000-5555',
      email: 'contato@santoamaroconstrutora.com.br',
      website: 'https://santoamaroconstrutora.com.br',
      socialLinks: { instagram: '@santoamaroconstrutora' },
      neighborhood: 'Santo Amaro',
      city: 'São Paulo',
      state: 'SP',
      zipCode: '04750-000',
      latitude: -23.656,
      longitude: -46.708,
    },
  ];

  const companies = await Promise.all(
    companiesData.map((data) =>
      prisma.company.upsert({
        where: { id: data.id },
        update: {},
        create: {
          ...data,
          addressLine: `Rua Fictícia, 100 - ${data.neighborhood}`,
        },
      }),
    ),
  );

  const [horizonte, valeVerde, novaAurora, edificar, santoAmaro] = companies;

  const developmentsData = [
    {
      id: '00000000-0000-0000-0000-000000000201',
      name: 'Edifício Horizonte Ipiranga',
      companyId: horizonte.id,
      status: 'LAUNCH' as const,
      standard: 'HIGH_END' as const,
      propertyType: 'RESIDENTIAL' as const,
      floorsCount: 22,
      unitsCount: 120,
      startDate: new Date('2026-01-15'),
      deliveryForecast: new Date('2029-06-30'),
      neighborhood: 'Pinheiros',
      city: 'São Paulo',
      state: 'SP',
      latitude: -23.5635,
      longitude: -46.683,
      aiScore: 82,
      aiSummary:
        'Empreendimento de alto padrão em fase de lançamento, região com forte demanda por esquadrias premium.',
      photos: [
        'https://picsum.photos/seed/horizonte-ipiranga-1/640/480',
        'https://picsum.photos/seed/horizonte-ipiranga-2/640/480',
      ],
    },
    {
      id: '00000000-0000-0000-0000-000000000202',
      name: 'Residencial Jardim Horizonte',
      companyId: horizonte.id,
      status: 'STRUCTURE' as const,
      standard: 'STANDARD' as const,
      propertyType: 'RESIDENTIAL' as const,
      floorsCount: 15,
      unitsCount: 80,
      startDate: new Date('2025-06-01'),
      deliveryForecast: new Date('2027-12-01'),
      neighborhood: 'Pinheiros',
      city: 'São Paulo',
      state: 'SP',
      latitude: -23.561,
      longitude: -46.68,
      aiScore: 68,
      aiSummary:
        'Obra em fase de estrutura, janela de venda de esquadrias em 6-9 meses.',
      photos: ['https://picsum.photos/seed/jardim-horizonte-1/640/480'],
    },
    {
      id: '00000000-0000-0000-0000-000000000203',
      name: 'Vale Verde Residence',
      companyId: valeVerde.id,
      status: 'FOUNDATION' as const,
      standard: 'STANDARD' as const,
      propertyType: 'RESIDENTIAL' as const,
      floorsCount: 18,
      unitsCount: 200,
      startDate: new Date('2026-03-01'),
      deliveryForecast: new Date('2029-01-01'),
      neighborhood: 'Vila Mariana',
      city: 'São Paulo',
      state: 'SP',
      latitude: -23.588,
      longitude: -46.639,
      aiScore: 75,
      aiSummary:
        'Grande volume de unidades, alto potencial de venda por escala.',
      photos: [
        'https://picsum.photos/seed/vale-verde-1/640/480',
        'https://picsum.photos/seed/vale-verde-2/640/480',
        'https://picsum.photos/seed/vale-verde-3/640/480',
      ],
    },
    {
      id: '00000000-0000-0000-0000-000000000204',
      name: 'Moema Prime Tower',
      companyId: novaAurora.id,
      status: 'FINISHING' as const,
      standard: 'LUXURY' as const,
      propertyType: 'RESIDENTIAL' as const,
      floorsCount: 30,
      unitsCount: 40,
      startDate: new Date('2024-02-01'),
      deliveryForecast: new Date('2026-10-01'),
      neighborhood: 'Moema',
      city: 'São Paulo',
      state: 'SP',
      latitude: -23.601,
      longitude: -46.664,
      aiScore: 58,
      aiSummary:
        'Fase de acabamento avançada, janela de venda de esquadrias reduzida.',
      photos: ['https://picsum.photos/seed/moema-prime-1/640/480'],
    },
    {
      id: '00000000-0000-0000-0000-000000000205',
      name: 'Tatuapé Garden',
      companyId: edificar.id,
      status: 'LAUNCH' as const,
      standard: 'ECONOMIC' as const,
      propertyType: 'RESIDENTIAL' as const,
      floorsCount: 10,
      unitsCount: 300,
      startDate: new Date('2026-05-01'),
      deliveryForecast: new Date('2029-09-01'),
      neighborhood: 'Tatuapé',
      city: 'São Paulo',
      state: 'SP',
      latitude: -23.541,
      longitude: -46.577,
      aiScore: 71,
      aiSummary:
        'Alto volume de unidades econômicas, oportunidade por escala de fornecimento.',
      photos: [
        'https://picsum.photos/seed/tatuape-garden-1/640/480',
        'https://picsum.photos/seed/tatuape-garden-2/640/480',
      ],
    },
    {
      id: '00000000-0000-0000-0000-000000000206',
      name: 'Santo Amaro Business Residence',
      companyId: santoAmaro.id,
      status: 'DELIVERED' as const,
      standard: 'STANDARD' as const,
      propertyType: 'COMMERCIAL' as const,
      floorsCount: 8,
      unitsCount: 150,
      startDate: new Date('2022-01-01'),
      deliveryForecast: new Date('2024-12-01'),
      neighborhood: 'Santo Amaro',
      city: 'São Paulo',
      state: 'SP',
      latitude: -23.657,
      longitude: -46.709,
      aiScore: 20,
      aiSummary:
        'Empreendimento já entregue, baixo potencial comercial para novas vendas.',
      photos: ['https://picsum.photos/seed/santo-amaro-business-1/640/480'],
    },
  ];

  const developments = await Promise.all(
    developmentsData.map((data) =>
      prisma.development.upsert({
        where: { id: data.id },
        update: {},
        create: data,
      }),
    ),
  );

  const [
    horizonteIpiranga,
    ,
    valeVerdeResidence,
    moemaPrimeTower,
    tatuapeGarden,
  ] = developments;

  const leadsData = [
    {
      id: '00000000-0000-0000-0000-000000000301',
      tenantId: tenant.id,
      companyId: horizonte.id,
      developmentId: horizonteIpiranga.id,
      ownerId: salesRep.id,
      temperature: 'HOT' as const,
      commercialStatus: 'NEGOTIATING' as const,
      notes:
        'Reunião com o engenheiro responsável agendada para a próxima semana.',
    },
    {
      id: '00000000-0000-0000-0000-000000000302',
      tenantId: tenant.id,
      companyId: valeVerde.id,
      developmentId: valeVerdeResidence.id,
      ownerId: manager.id,
      temperature: 'WARM' as const,
      commercialStatus: 'CONTACTED' as const,
      notes:
        'Primeiro contato realizado, aguardando retorno com o projeto executivo.',
    },
    {
      id: '00000000-0000-0000-0000-000000000303',
      tenantId: tenant.id,
      companyId: novaAurora.id,
      developmentId: moemaPrimeTower.id,
      ownerId: salesRep.id,
      temperature: 'COLD' as const,
      commercialStatus: 'NEW' as const,
      notes: 'Obra em fase avançada, baixa prioridade.',
    },
    {
      id: '00000000-0000-0000-0000-000000000304',
      tenantId: tenant.id,
      companyId: edificar.id,
      developmentId: tatuapeGarden.id,
      ownerId: null,
      temperature: 'WARM' as const,
      commercialStatus: 'NEW' as const,
      notes: 'Lead gerado automaticamente pelo radar de oportunidades.',
    },
  ];

  const leads = await Promise.all(
    leadsData.map((data) =>
      prisma.lead.upsert({ where: { id: data.id }, update: {}, create: data }),
    ),
  );

  const [leadHorizonte, leadValeVerde] = leads;

  await prisma.interaction.createMany({
    data: [
      {
        leadId: leadHorizonte.id,
        authorId: salesRep.id,
        type: 'CALL',
        message: 'Ligação inicial com o setor de compras da construtora.',
      },
      {
        leadId: leadHorizonte.id,
        authorId: salesRep.id,
        type: 'NOTE',
        message: 'Enviado catálogo de esquadrias de alto padrão por e-mail.',
      },
      {
        leadId: leadValeVerde.id,
        authorId: manager.id,
        type: 'EMAIL',
        message: 'E-mail de apresentação enviado ao gerente de suprimentos.',
      },
    ],
    skipDuplicates: true,
  });

  await prisma.search.createMany({
    data: [
      {
        tenantId: tenant.id,
        userId: salesRep.id,
        latitude: -23.5613,
        longitude: -46.6565,
        radiusKm: 10,
        filters: { status: ['LAUNCH', 'STRUCTURE'] },
        resultsCount: 3,
      },
      {
        tenantId: tenant.id,
        userId: manager.id,
        latitude: -23.5875,
        longitude: -46.6388,
        radiusKm: 5,
        filters: { standard: ['STANDARD', 'HIGH_END'] },
        resultsCount: 1,
      },
    ],
    skipDuplicates: true,
  });

  console.log('Seed concluído.');
  console.log(`Tenant: ${tenant.name}`);
  console.log(`Usuários: ${admin.email}, ${manager.email}, ${salesRep.email}`);
  console.log(
    `Senha padrão de todos os usuários de teste: ${DEFAULT_PASSWORD}`,
  );
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => {
    void prisma.$disconnect();
  });
