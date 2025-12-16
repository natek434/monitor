import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth';

export async function GET(req: Request) {
  try {
    requireAdmin();
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const { searchParams } = new URL(req.url);
  const monitorId = searchParams.get('monitorId');
  const runs = await prisma.monitorRun.findMany({
    where: monitorId ? { monitorId: Number(monitorId) } : undefined,
    orderBy: { startedAt: 'desc' },
    take: 50,
  });
  return NextResponse.json(runs);
}
