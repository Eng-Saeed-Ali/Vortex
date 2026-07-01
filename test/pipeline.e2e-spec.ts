import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { PrismaClient } from '../generated/prisma';
import { PostgreSqlContainer, StartedPostgreSqlContainer } from '@testcontainers/postgresql';
import { RedisContainer, StartedRedisContainer } from '@testcontainers/redis';
import { AppModule } from '../src/app.module';
import { QueueModule } from '../src/shared/queue/queue.module';
import { QueueName } from '../src/shared/queue/queue.module';

/**
 * Integration test for the full pipeline: Ingestion → Cleansing → Normalization → Deduplication
 * Uses Testcontainers for PostgreSQL and Redis
 */
describe('Pipeline E2E: Ingestion → Cleansing → Normalization → Deduplication', () => {
  let postgresContainer: StartedPostgreSqlContainer;
  let redisContainer: StartedRedisContainer;
  let app: INestApplication;
  let prisma: PrismaClient;
  let moduleFixture: TestingModule;

  // Set timeout for container startup
  jest.setTimeout(120000);

  beforeAll(async () => {
    // Start PostgreSQL container with PostGIS
    postgresContainer = await new PostgreSqlContainer('postgis/postgis:16-3.4-alpine')
      .withDatabase('vortex_test')
      .withUsername('test')
      .withPassword('test')
      .start();

    // Start Redis container
    redisContainer = await new RedisContainer('redis:7-alpine').start();

    // Set environment variables for test containers
    process.env.DATABASE_URL = postgresContainer.getConnectionUri();
    process.env.REDIS_URL = redisContainer.getConnectionUrl();
    process.env.NODE_ENV = 'test';

    // Initialize Prisma client
    prisma = new PrismaClient();

    await prisma.$connect();

    // Run migrations
    const { execSync } = require('child_process');
    execSync('npx prisma migrate deploy', {
      cwd: process.cwd() + '/vortex',
      stdio: 'inherit',
      env: {
        ...process.env,
        DATABASE_URL: postgresContainer.getConnectionUri(),
      },
    });

    // Create test module with test configuration
    moduleFixture = await Test.createTestingModule({
      imports: [
        AppModule,
        QueueModule.forRoot(),
      ],
    }).compile();
    app = moduleFixture.createNestApplication();
    await app.init();
  }, 180000);

  afterAll(async () => {
    if (app) await app.close();
    if (moduleFixture) await moduleFixture.close();
    if (prisma) await prisma.$disconnect();
    if (postgresContainer) await postgresContainer.stop();
    if (redisContainer) await redisContainer.stop();
  });

  beforeEach(async () => {
    // Clean database before each test
    await prisma.auditLog.deleteMany();
    await prisma.masterLead.deleteMany();
    await prisma.normalizedLead.deleteMany();
    await prisma.rawLead.deleteMany();
  });

  describe('Idempotency', () => {
    it('should return 409 Conflict on duplicate ingestion (same source + sourceId)', async () => {
      const leadData = {
        source: 'google_maps',
        sourceId: 'ChIJN1t_tDeuEmsRUsoyG83frY4',
        name: 'Acme Corporation',
        phone: '+966501234567',
        email: 'contact@acme.com',
        website: 'https://acme.com',
        address: {
          street: 'King Fahd Road',
          city: 'Riyadh',
          region: 'Riyadh Region',
          postalCode: '12345',
          country: 'SA',
        },
        categories: ['technology', 'consulting'],
      };

      // First ingestion - should succeed
      const response1 = await request(app.getHttpServer())
        .post('/api/leads')
        .send(leadData)
        .expect(201);

      expect(response1.body.isNew).toBe(true);
      expect(response1.body.rawLeadId).toBeDefined();

      // Second ingestion with same source + sourceId - should return 409
      const response2 = await request(app.getHttpServer())
        .post('/api/leads')
        .send(leadData)
        .expect(409);

      expect(response2.body.isNew).toBe(false);
      expect(response2.body.rawLeadId).toBe(response1.body.rawLeadId);
    });

    it('should allow different sourceId for same source', async () => {
      const leadData1 = {
        source: 'google_maps',
        sourceId: 'ChIJN1t_tDeuEmsRUsoyG83frY4',
        name: 'Acme Corporation',
        phone: '+966501234567',
      };

      const leadData2 = {
        source: 'google_maps',
        sourceId: 'ChIJN1t_tDeuEmsRUsoyG83frY5', // Different sourceId
        name: 'Acme Corporation',
        phone: '+966501234567',
      };

      const response1 = await request(app.getHttpServer())
        .post('/api/leads')
        .send(leadData1)
        .expect(201);

      const response2 = await request(app.getHttpServer())
        .post('/api/leads')
        .send(leadData2)
        .expect(201);

      expect(response1.body.isNew).toBe(true);
      expect(response2.body.isNew).toBe(true);
      expect(response1.body.rawLeadId).not.toBe(response2.body.rawLeadId);
    });
  });

  describe('Full Pipeline: Ingestion → Cleansing → Normalization → Deduplication', () => {
    it('should process a lead through the full pipeline and create a MasterLead', async () => {
      const leadData = {
        source: 'google_maps',
        sourceId: 'ChIJN1t_tDeuEmsRUsoyG83frY4',
        name: 'Acme Corporation',
        phone: '+966501234567',
        email: 'contact@acme.com',
        website: 'https://acme.com',
        address: {
          street: 'King Fahd Road',
          city: 'Riyadh',
          region: 'Riyadh Region',
          postalCode: '12345',
          country: 'SA',
        },
        categories: ['technology', 'consulting'],
      };

      // Ingest lead
      const response = await request(app.getHttpServer())
        .post('/api/leads')
        .send(leadData)
        .expect(201);

      expect(response.body.isNew).toBe(true);
      const rawLeadId = response.body.rawLeadId;

      // Wait for pipeline to process (poll for MasterLead creation)
      let masterLead = null;
      let attempts = 0;
      const maxAttempts = 30; // 30 seconds max

      while (!masterLead && attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        masterLead = await prisma.masterLead.findFirst({
          where: { sourceId: leadData.sourceId },
        });
        attempts++;
      }

      expect(masterLead).not.toBeNull();
      expect(masterLead?.normalizedName).toBe('Acme Corporation');
      expect(masterLead?.phoneE164).toBe('+966501234567');
      expect(masterLead?.email).toBe('contact@acme.com');
      expect(masterLead?.qualityScore).toBeGreaterThan(0);
      expect(masterLead?.createdAt).toBeDefined();

      // Verify audit log was created
      const auditLogs = await prisma.auditLog.findMany({
        where: { entityId: masterLead!.id },
      });
      expect(auditLogs.length).toBeGreaterThan(0);
      expect(auditLogs[0].action).toBe('CREATE');
    }, 60000);

    it('should fuzzy merge similar leads (TechCorp vs Tech Corp)', async () => {
      const lead1 = {
        source: 'google_maps',
        sourceId: 'place_1',
        name: 'TechCorp Solutions',
        phone: '+966501234567',
        email: 'info@techcorp.com',
        address: {
          street: 'Olaya Street',
          city: 'Riyadh',
          region: 'Riyadh Region',
          country: 'SA',
        },
      };

      const lead2 = {
        source: 'manual_entry',
        sourceId: 'MAN-001',
        name: 'Tech Corp Solutions', // Slightly different name
        phone: '+966501234567', // Same phone
        email: 'contact@techcorp.com', // Different email
        address: {
          street: 'Olaya St', // Abbreviated
          city: 'Riyadh',
          region: 'Riyadh Region',
          country: 'SA',
        },
      };

      // Ingest first lead
      await request(app.getHttpServer())
        .post('/api/leads')
        .send(lead1)
        .expect(201);

      // Wait for first lead to be processed
      let masterLead1 = null;
      let attempts = 0;
      while (!masterLead1 && attempts < 20) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        masterLead1 = await prisma.masterLead.findFirst({
          where: { sourceId: lead1.sourceId },
        });
        attempts++;
      }

      expect(masterLead1).not.toBeNull();
      const firstMasterLeadId = masterLead1!.id;

      // Ingest second lead (should fuzzy match and merge)
      await request(app.getHttpServer())
        .post('/api/leads')
        .send(lead2)
        .expect(201);

      // Wait for merge to complete
      let masterLead2 = null;
      attempts = 0;
      while (!masterLead2 && attempts < 20) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        masterLead2 = await prisma.masterLead.findFirst({
          where: { sourceId: lead2.sourceId },
        });
        attempts++;
      }

      // Should have merged into the same master lead
      expect(masterLead2).not.toBeNull();
      expect(masterLead2!.id).toBe(firstMasterLeadId);

      // Verify merged data has both emails (coalesced)
      const mergedLead = await prisma.masterLead.findUnique({
        where: { id: firstMasterLeadId },
      });
      expect(mergedLead?.email).toBeDefined();

      // Verify audit log has MERGE action
      const auditLogs = await prisma.auditLog.findMany({
        where: { entityId: firstMasterLeadId },
        orderBy: { createdAt: 'asc' },
      });
      const mergeLog = auditLogs.find((log: any) => log.action === 'MERGE');
      expect(mergeLog).toBeDefined();
      expect(mergeLog?.beforeState).toBeDefined();
      expect(mergeLog?.afterState).toBeDefined();
    }, 90000);

    it('should exact match by Google Place ID', async () => {
      const googlePlaceId = 'ChIJN1t_tDeuEmsRUsoyG83frY4';
      
      const lead1 = {
        source: 'google_maps',
        sourceId: 'place_1',
        name: 'Original Name',
        phone: '+966501234567',
        address: {
          city: 'Riyadh',
          country: 'SA',
          googlePlaceId,
        },
      };

      const lead2 = {
        source: 'google_maps',
        sourceId: 'place_2',
        name: 'Completely Different Name',
        phone: '+966509999999',
        address: {
          city: 'Riyadh',
          country: 'SA',
          googlePlaceId, // Same Google Place ID
        },
      };

      // Ingest first lead
      await request(app.getHttpServer())
        .post('/api/leads')
        .send(lead1)
        .expect(201);

      // Wait for processing
      let masterLead1 = null;
      let attempts = 0;
      while (!masterLead1 && attempts < 20) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        masterLead1 = await prisma.masterLead.findFirst({
          where: { googlePlaceId },
        });
        attempts++;
      }

      expect(masterLead1).not.toBeNull();
      const firstId = masterLead1!.id;

      // Ingest second lead with same Google Place ID
      await request(app.getHttpServer())
        .post('/api/leads')
        .send(lead2)
        .expect(201);

      // Wait for merge
      let masterLead2 = null;
      attempts = 0;
      while (!masterLead2 && attempts < 20) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        masterLead2 = await prisma.masterLead.findFirst({
          where: { sourceId: lead2.sourceId },
        });
        attempts++;
      }

      // Should have merged (same Google Place ID = exact match)
      expect(masterLead2).not.toBeNull();
      expect(masterLead2!.id).toBe(firstId);
    }, 60000);
  });

  describe('Pipeline Performance', () => {
    it('should process 10 leads within 30 seconds', async () => {
      const leads = Array.from({ length: 10 }, (_, i) => ({
        source: 'google_maps',
        sourceId: `place_${i}`,
        name: `Company ${i}`,
        phone: `+9665012345${i.toString().padStart(2, '0')}`,
        email: `company${i}@example.com`,
        address: {
          street: `Street ${i}`,
          city: 'Riyadh',
          region: 'Riyadh Region',
          country: 'SA',
        },
      }));

      // Ingest all leads
      const startTime = Date.now();
      for (const lead of leads) {
        await request(app.getHttpServer())
          .post('/api/leads')
          .send(lead)
          .expect(201);
      }

      // Wait for all to be processed
      let processedCount = 0;
      let attempts = 0;
      while (processedCount < 10 && attempts < 30) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        processedCount = await prisma.masterLead.count();
        attempts++;
      }

      const duration = Date.now() - startTime;
      expect(processedCount).toBe(10);
      expect(duration).toBeLessThan(30000); // 30 seconds
    }, 60000);
  });
});