import { prisma } from '@/lib/prisma';
import { isAdmin } from '@/lib/auth';
import Link from 'next/link';

async function getData() {
  const monitors = await prisma.monitor.findMany({
    include: { category: true, runs: { orderBy: { startedAt: 'desc' }, take: 1 } },
  });
  const runs = await prisma.monitorRun.findMany({ orderBy: { startedAt: 'desc' }, take: 5, include: { monitor: { include: { category: true } } } });
  return { monitors, runs };
}

export default async function OverviewPage() {
  if (!isAdmin()) {
    return <div className="text-red-400">Unauthorized. Set the admin cookie to access.</div>;
  }

  const { monitors, runs } = await getData();
  const healthy = monitors.filter((m) => m.runs[0]?.status === 'OK').length;
  const warning = monitors.filter((m) => m.runs[0]?.status === 'WARN').length;
  const failing = monitors.filter((m) => m.runs[0]?.status === 'FAIL').length;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card">
          <div className="text-sm text-slate-400">Healthy</div>
          <div className="text-3xl font-semibold text-emerald-300">{healthy}</div>
        </div>
        <div className="card">
          <div className="text-sm text-slate-400">Warnings</div>
          <div className="text-3xl font-semibold text-amber-300">{warning}</div>
        </div>
        <div className="card">
          <div className="text-sm text-slate-400">Failing</div>
          <div className="text-3xl font-semibold text-red-300">{failing}</div>
        </div>
      </div>

      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Latest Runs</h2>
          <Link href="/admin/monitors" className="text-sm text-emerald-400 hover:text-emerald-300">View monitors</Link>
        </div>
        <div className="divide-y divide-slate-800">
          {runs.map((run) => (
            <div key={run.id} className="py-3 flex items-center justify-between">
              <div>
                <div className="font-medium">{run.monitor.name}</div>
                <div className="text-xs text-slate-400">{run.monitor.category.name}</div>
              </div>
              <div className={`badge ${run.status === 'OK' ? 'badge-green' : run.status === 'WARN' ? 'badge-yellow' : 'badge-red'}`}>
                {run.status}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
