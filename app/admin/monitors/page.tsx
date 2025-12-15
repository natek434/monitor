import { MonitorTable } from '@/components/MonitorTable';
import { isAdmin } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export default async function MonitorsPage() {
  if (!isAdmin()) {
    return <div className="text-red-400">Unauthorized. Set the admin cookie to access.</div>;
  }

  const monitors = await prisma.monitor.findMany({ include: { category: true }, orderBy: { name: 'asc' } });
  const categories = await prisma.monitorCategory.findMany({ orderBy: { name: 'asc' } });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold mb-2">Monitors</h1>
        <p className="text-sm text-slate-400">Add, edit, and quickly test monitors. Category badges prevent cross-tool misuse.</p>
      </div>
      <MonitorTable monitors={monitors} categories={categories} />
    </div>
  );
}
