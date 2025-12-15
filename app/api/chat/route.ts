import { NextResponse } from 'next/server';
import { getAiReadableMonitors, getAiReadableRuns } from '@/lib/ai';
import { prisma } from '@/lib/prisma';
import { isAdmin } from '@/lib/auth';
import { validateConfig } from '@/lib/monitorSchemas';

export async function POST(req: Request) {
  if (!isAdmin()) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const { prompt } = await req.json();
  const lower = String(prompt ?? '').toLowerCase();

  if (lower.includes('draft')) {
    const categoryKey = lower.includes('cloudflare') ? 'CLOUDFLARE' : lower.includes('docker') ? 'DOCKER' : 'WEBSITE';
    const category = await prisma.monitorCategory.findFirst({ where: { key: categoryKey } });
    if (!category) return NextResponse.json({ error: 'Category missing' }, { status: 400 });

    const payload = { note: prompt };
    validateConfig('SUGGESTION', payload);
    const monitor = await prisma.monitor.create({
      data: {
        name: `Draft: ${prompt.slice(0, 32)}`,
        categoryId: category.id,
        subtype: 'SUGGESTION',
        enabled: false,
        scheduleCron: '0 * * * *',
        ownershipScope: 'draft',
        config: payload,
      },
    });

    return NextResponse.json({ answer: `Created disabled draft monitor ${monitor.name} in ${category.key}. Awaiting admin approval.`, references: [{ monitorId: monitor.id }] });
  }

  const monitors = await getAiReadableMonitors();
  const runs = await getAiReadableRuns();

  const failing = runs.filter((r) => r.status === 'FAIL').slice(0, 3);
  const disabled = monitors.filter((m) => !m.enabled);
  const summary = `I can safely read ${monitors.length} monitors. Disabled: ${disabled.length}. Recent failures: ${failing.length > 0 ? failing.map((f) => `#${f.monitorId}`).join(', ') : 'none'}.`;

  return NextResponse.json({ answer: summary, references: failing.map((f) => ({ runId: f.id, monitorId: f.monitorId })) });
}
