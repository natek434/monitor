import { prisma } from './prisma';

export async function getAiReadableMonitors() {
  return prisma.monitor.findMany({
    select: {
      id: true,
      name: true,
      category: { select: { id: true, key: true, name: true, isAiReadable: true } },
      subtype: true,
      enabled: true,
      scheduleCron: true,
      config: true,
      ownershipScope: true,
      createdAt: true,
      updatedAt: true,
    },
    where: { category: { isAiReadable: true } },
  });
}

export async function getAiReadableRuns(monitorId?: number) {
  return prisma.monitorRun.findMany({
    select: {
      id: true,
      monitorId: true,
      startedAt: true,
      finishedAt: true,
      status: true,
      metrics: true,
      summary: true,
    },
    where: monitorId ? { monitorId } : undefined,
    orderBy: { startedAt: 'desc' },
    take: 50,
  });
}
