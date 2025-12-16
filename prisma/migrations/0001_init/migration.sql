-- Create enums
CREATE TYPE "MonitorRunStatus" AS ENUM ('OK', 'WARN', 'FAIL');
CREATE TYPE "CommandStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'EXECUTED');

-- Core tables
CREATE TABLE "MonitorCategory" (
  "id" SERIAL PRIMARY KEY,
  "key" TEXT NOT NULL UNIQUE,
  "name" TEXT NOT NULL,
  "isAiReadable" BOOLEAN NOT NULL DEFAULT FALSE,
  "isAiActionable" BOOLEAN NOT NULL DEFAULT FALSE,
  "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE TABLE "ToolCapability" (
  "id" SERIAL PRIMARY KEY,
  "key" TEXT NOT NULL UNIQUE
);

CREATE TABLE "CategoryCapability" (
  "categoryId" INTEGER NOT NULL REFERENCES "MonitorCategory"("id") ON DELETE CASCADE,
  "capabilityId" INTEGER NOT NULL REFERENCES "ToolCapability"("id") ON DELETE CASCADE,
  PRIMARY KEY ("categoryId", "capabilityId")
);

CREATE TABLE "Monitor" (
  "id" SERIAL PRIMARY KEY,
  "name" TEXT NOT NULL,
  "categoryId" INTEGER NOT NULL REFERENCES "MonitorCategory"("id"),
  "subtype" TEXT NOT NULL,
  "enabled" BOOLEAN NOT NULL DEFAULT TRUE,
  "scheduleCron" TEXT NOT NULL,
  "config" JSONB NOT NULL,
  "ownershipScope" TEXT NOT NULL,
  "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE TABLE "MonitorRun" (
  "id" SERIAL PRIMARY KEY,
  "monitorId" INTEGER NOT NULL REFERENCES "Monitor"("id") ON DELETE CASCADE,
  "startedAt" TIMESTAMP WITH TIME ZONE NOT NULL,
  "finishedAt" TIMESTAMP WITH TIME ZONE,
  "status" "MonitorRunStatus" NOT NULL,
  "metrics" JSONB NOT NULL,
  "summary" TEXT NOT NULL,
  "raw" JSONB
);

CREATE TABLE "Secret" (
  "id" SERIAL PRIMARY KEY,
  "name" TEXT NOT NULL,
  "categoryId" INTEGER NOT NULL REFERENCES "MonitorCategory"("id"),
  "encryptedValue" TEXT NOT NULL,
  "scope" TEXT NOT NULL,
  "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE TABLE "AiCommandQueue" (
  "id" SERIAL PRIMARY KEY,
  "requestedBy" TEXT NOT NULL,
  "categoryId" INTEGER NOT NULL REFERENCES "MonitorCategory"("id"),
  "capabilityId" INTEGER REFERENCES "ToolCapability"("id"),
  "capabilityKey" TEXT NOT NULL,
  "payload" JSONB NOT NULL,
  "status" "CommandStatus" NOT NULL DEFAULT 'PENDING',
  "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Sanctioned AI readable views
CREATE VIEW ai_readable_monitors AS
SELECT m.id,
       m.name,
       m."categoryId",
       m.subtype,
       m.enabled,
       m."scheduleCron",
       m.config,
       m."ownershipScope",
       m."createdAt",
       m."updatedAt"
FROM "Monitor" m
JOIN "MonitorCategory" c ON c.id = m."categoryId"
WHERE c."isAiReadable" = TRUE;

CREATE VIEW ai_readable_runs AS
SELECT r.id,
       r."monitorId",
       r."startedAt",
       r."finishedAt",
       r.status,
       r.metrics,
       r.summary
FROM "MonitorRun" r
JOIN "Monitor" m ON m.id = r."monitorId"
JOIN "MonitorCategory" c ON c.id = m."categoryId"
WHERE c."isAiReadable" = TRUE;

-- Seed monitor categories
INSERT INTO "MonitorCategory" ("key", "name", "isAiReadable", "isAiActionable") VALUES
('WEBSITE', 'Websites & Endpoints', TRUE, TRUE),
('DOCKER', 'Docker Swarm', TRUE, TRUE),
('PROXMOX', 'Proxmox Cluster', TRUE, TRUE),
('CEPH', 'Ceph / CephFS', TRUE, TRUE),
('NETWORK', 'Network & Gateway', TRUE, TRUE),
('CLOUDFLARE', 'Cloudflare Tunnels', TRUE, TRUE);

-- Seed tool capabilities
INSERT INTO "ToolCapability" ("key") VALUES
('HTTP_GET'),
('TLS_CHECK'),
('DOCKER_API_READ'),
('PROXMOX_API_READ'),
('CEPH_STATUS_READ'),
('ICMP_PING'),
('DNS_LOOKUP'),
('CLOUDFLARE_API_READ');

-- Map capabilities to categories
INSERT INTO "CategoryCapability" ("categoryId", "capabilityId")
SELECT c.id, t.id FROM "MonitorCategory" c JOIN "ToolCapability" t ON
  (c."key" = 'WEBSITE' AND t."key" IN ('HTTP_GET','TLS_CHECK')) OR
  (c."key" = 'DOCKER' AND t."key" = 'DOCKER_API_READ') OR
  (c."key" = 'PROXMOX' AND t."key" = 'PROXMOX_API_READ') OR
  (c."key" = 'CEPH' AND t."key" = 'CEPH_STATUS_READ') OR
  (c."key" = 'NETWORK' AND t."key" IN ('ICMP_PING','DNS_LOOKUP')) OR
  (c."key" = 'CLOUDFLARE' AND t."key" = 'CLOUDFLARE_API_READ');
