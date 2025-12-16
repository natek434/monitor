-- CreateEnum
CREATE TYPE "MonitorRunStatus" AS ENUM ('OK', 'WARN', 'FAIL');

-- CreateEnum
CREATE TYPE "CommandStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'EXECUTED');

-- CreateTable
CREATE TABLE "MonitorCategory" (
    "id" SERIAL NOT NULL,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "isAiReadable" BOOLEAN NOT NULL DEFAULT false,
    "isAiActionable" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MonitorCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ToolCapability" (
    "id" SERIAL NOT NULL,
    "key" TEXT NOT NULL,

    CONSTRAINT "ToolCapability_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CategoryCapability" (
    "categoryId" INTEGER NOT NULL,
    "capabilityId" INTEGER NOT NULL,

    CONSTRAINT "CategoryCapability_pkey" PRIMARY KEY ("categoryId","capabilityId")
);

-- CreateTable
CREATE TABLE "Monitor" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "categoryId" INTEGER NOT NULL,
    "subtype" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "scheduleCron" TEXT NOT NULL,
    "config" JSONB NOT NULL,
    "ownershipScope" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Monitor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MonitorRun" (
    "id" SERIAL NOT NULL,
    "monitorId" INTEGER NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL,
    "finishedAt" TIMESTAMP(3),
    "status" "MonitorRunStatus" NOT NULL,
    "metrics" JSONB NOT NULL,
    "summary" TEXT NOT NULL,
    "raw" JSONB,

    CONSTRAINT "MonitorRun_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Secret" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "categoryId" INTEGER NOT NULL,
    "encryptedValue" TEXT NOT NULL,
    "scope" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Secret_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AiCommandQueue" (
    "id" SERIAL NOT NULL,
    "requestedBy" TEXT NOT NULL,
    "categoryId" INTEGER NOT NULL,
    "capabilityId" INTEGER,
    "capabilityKey" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "status" "CommandStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AiCommandQueue_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "MonitorCategory_key_key" ON "MonitorCategory"("key");

-- CreateIndex
CREATE UNIQUE INDEX "ToolCapability_key_key" ON "ToolCapability"("key");

-- AddForeignKey
ALTER TABLE "CategoryCapability" ADD CONSTRAINT "CategoryCapability_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "MonitorCategory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CategoryCapability" ADD CONSTRAINT "CategoryCapability_capabilityId_fkey" FOREIGN KEY ("capabilityId") REFERENCES "ToolCapability"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Monitor" ADD CONSTRAINT "Monitor_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "MonitorCategory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MonitorRun" ADD CONSTRAINT "MonitorRun_monitorId_fkey" FOREIGN KEY ("monitorId") REFERENCES "Monitor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Secret" ADD CONSTRAINT "Secret_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "MonitorCategory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AiCommandQueue" ADD CONSTRAINT "AiCommandQueue_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "MonitorCategory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AiCommandQueue" ADD CONSTRAINT "AiCommandQueue_capabilityId_fkey" FOREIGN KEY ("capabilityId") REFERENCES "ToolCapability"("id") ON DELETE SET NULL ON UPDATE CASCADE;
