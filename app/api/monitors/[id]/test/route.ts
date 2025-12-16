import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth';
import { capabilityByCategory } from '@/lib/capabilities';

export async function POST(_req: Request, { params }: { params: { id: string } }) {
  try {
    requireAdmin();
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const monitor = await prisma.monitor.findUnique({ where: { id: Number(params.id) }, include: { category: true } });
  if (!monitor) return NextResponse.json({ error: 'Monitor not found' }, { status: 404 });

  const defaultCapability = capabilityByCategory[monitor.category.key]?.[0];
  if (!defaultCapability) return NextResponse.json({ error: 'No capability available' }, { status: 400 });

  const command = await prisma.aiCommandQueue.create({
    data: {
      requestedBy: 'admin',
      categoryId: monitor.categoryId,
      capabilityKey: defaultCapability,
      status: 'APPROVED',
      payload: { action: 'TEST_MONITOR', monitorId: monitor.id },
    },
  });

  return NextResponse.json({ queued: true, commandId: command.id });
}
