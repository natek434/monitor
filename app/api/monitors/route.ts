import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth';
import { validateConfig } from '@/lib/monitorSchemas';
import { capabilityByCategory } from '@/lib/capabilities';

export async function GET() {
  try {
    requireAdmin();
  } catch (e) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const monitors = await prisma.monitor.findMany({ include: { category: true } });
  return NextResponse.json(monitors);
}

export async function POST(req: Request) {
  try {
    requireAdmin();
  } catch (e) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const body = await req.json();
  const { name, categoryId, subtype, enabled, scheduleCron, ownershipScope, config } = body;
  const parsedConfig = validateConfig(subtype, config);
  const category = await prisma.monitorCategory.findUnique({ where: { id: Number(categoryId) }, include: { allowedCapabilities: { include: { capability: true } } } });
  if (!category) return NextResponse.json({ error: 'Category not found' }, { status: 400 });

  // ensure subtype maps to allowed capability
  const capabilityKey = (capabilityByCategory as Record<string, string[]>)[category.key]?.[0];
  if (!capabilityKey) return NextResponse.json({ error: 'No capability for category' }, { status: 400 });

  const monitor = await prisma.monitor.create({
    data: {
      name,
      categoryId: Number(categoryId),
      subtype,
      enabled: Boolean(enabled),
      scheduleCron,
      ownershipScope,
      config: parsedConfig,
    },
  });

  await prisma.aiCommandQueue.create({
    data: {
      requestedBy: 'admin',
      categoryId: monitor.categoryId,
      capabilityKey,
      status: 'APPROVED',
      payload: { action: 'SYNC_MONITOR', monitorId: monitor.id },
    },
  });

  return NextResponse.json(monitor, { status: 201 });
}
