import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireServiceToken } from '@/lib/auth';

export async function POST() {
  try {
    requireServiceToken();
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const commands = await prisma.aiCommandQueue.findMany({
    where: { status: 'APPROVED' },
    include: { category: true },
    orderBy: { createdAt: 'asc' },
    take: 25,
  });

  return NextResponse.json(commands);
}
