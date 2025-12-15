import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireServiceToken } from '@/lib/auth';

export async function POST(req: Request) {
  try {
    requireServiceToken();
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const { searchParams } = new URL(req.url);
  const categoryKey = searchParams.get('category');
  const category = await prisma.monitorCategory.findUnique({ where: { key: categoryKey ?? '' } });
  if (!category) return NextResponse.json({ error: 'Unknown category' }, { status: 400 });

  const monitors = await prisma.monitor.findMany({ where: { categoryId: category.id, enabled: true } });
  return NextResponse.json(monitors);
}
