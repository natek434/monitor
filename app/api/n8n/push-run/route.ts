import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireServiceToken } from '@/lib/auth';
import { MonitorRunStatus } from '@prisma/client';

export async function POST(req: Request) {
  try {
    requireServiceToken();
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const body = await req.json();
  const { monitorId, startedAt, finishedAt, status, metrics, summary, raw } = body;
  if (!Object.values(MonitorRunStatus).includes(status)) {
    return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
  }
  const monitor = await prisma.monitor.findUnique({ where: { id: Number(monitorId) } });
  if (!monitor) return NextResponse.json({ error: 'Monitor not found' }, { status: 404 });

  const run = await prisma.monitorRun.create({
    data: {
      monitorId: monitor.id,
      startedAt: new Date(startedAt),
      finishedAt: finishedAt ? new Date(finishedAt) : null,
      status,
      metrics,
      summary,
      raw,
    },
  });

  return NextResponse.json(run, { status: 201 });
}
