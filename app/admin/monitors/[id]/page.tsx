import { RunHistoryChart } from '@/components/RunHistoryChart';
import { isAdmin } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';

export default async function MonitorDetail({ params }: { params: { id: string } }) {
  if (!isAdmin()) {
    return <div className="text-red-400">Unauthorized.</div>;
  }
  const monitor = await prisma.monitor.findUnique({ where: { id: Number(params.id) }, include: { category: true } });
  if (!monitor) return notFound();
  const runs = await prisma.monitorRun.findMany({ where: { monitorId: monitor.id }, orderBy: { startedAt: 'desc' }, take: 10 });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{monitor.name}</h1>
          <p className="text-sm text-slate-400">{monitor.category.name} • {monitor.subtype}</p>
        </div>
        <div className={`badge ${monitor.enabled ? 'badge-green' : 'badge-red'}`}>{monitor.enabled ? 'Enabled' : 'Disabled'}</div>
      </div>
      <div className="card">
        <h2 className="font-semibold mb-2">Run history</h2>
        <RunHistoryChart runs={runs.map((r) => ({ id: r.id, startedAt: r.startedAt, status: r.status }))} />
        <div className="mt-4 space-y-2 text-sm">
          {runs.map((run) => (
            <div key={run.id} className="flex items-center justify-between border border-slate-800 rounded px-3 py-2">
              <div>
                <div className="font-medium">{run.status}</div>
                <div className="text-xs text-slate-400">Started {new Date(run.startedAt).toLocaleString()}</div>
              </div>
              <div className="text-xs text-slate-300">{run.summary}</div>
            </div>
          ))}
        </div>
      </div>
      <div className="card">
        <h2 className="font-semibold mb-2">Config</h2>
        <pre className="text-xs bg-slate-900 p-3 rounded border border-slate-800 overflow-auto">{JSON.stringify(monitor.config, null, 2)}</pre>
      </div>
    </div>
  );
}
