import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { isCapabilityAllowed } from '@/lib/capabilities';
import { isAdmin } from '@/lib/auth';

export async function POST(req: Request) {
  if (!isAdmin()) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const { categoryId, capabilityKey, payload } = await req.json();
  const category = await prisma.monitorCategory.findUnique({ where: { id: Number(categoryId) } });
  if (!category) return NextResponse.json({ error: 'Category not found' }, { status: 404 });
  if (!isCapabilityAllowed(category.key, capabilityKey)) {
    return NextResponse.json({ error: 'Capability not allowed for category' }, { status: 400 });
  }

  const capability = await prisma.toolCapability.findUnique({ where: { key: capabilityKey } });
  const command = await prisma.aiCommandQueue.create({
    data: {
      requestedBy: 'chat',
      categoryId: category.id,
      capabilityId: capability?.id,
      capabilityKey,
      payload,
      status: 'PENDING',
    },
  });

  return NextResponse.json(command, { status: 201 });
}
