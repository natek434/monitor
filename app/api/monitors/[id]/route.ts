import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth';
import { validateConfig } from '@/lib/monitorSchemas';

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    requireAdmin();
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const body = await req.json();
  const monitor = await prisma.monitor.findUnique({ where: { id: Number(params.id) }, include: { category: true } });
  if (!monitor) return NextResponse.json({ error: 'Monitor not found' }, { status: 404 });

  let newConfig = monitor.config;
  if (body.config) {
    newConfig = validateConfig(body.subtype ?? monitor.subtype, body.config);
  }

  const updated = await prisma.monitor.update({
    where: { id: monitor.id },
    data: {
      name: body.name ?? monitor.name,
      subtype: body.subtype ?? monitor.subtype,
      enabled: typeof body.enabled === 'boolean' ? body.enabled : monitor.enabled,
      scheduleCron: body.scheduleCron ?? monitor.scheduleCron,
      ownershipScope: body.ownershipScope ?? monitor.ownershipScope,
      config: newConfig,
    },
  });

  return NextResponse.json(updated);
}
