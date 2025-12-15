'use client';

import { useMemo, useState } from 'react';
import { MonitorFormFields } from './MonitorFormFields';
import { Monitor, MonitorCategory } from '@prisma/client';

export type MonitorWithCategory = Monitor & { category: MonitorCategory };

type Props = {
  monitors: MonitorWithCategory[];
  categories: MonitorCategory[];
};

export function MonitorTable({ monitors, categories }: Props) {
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [creating, setCreating] = useState(false);
  const [newMonitor, setNewMonitor] = useState({
    name: '',
    categoryId: categories[0]?.id ?? 0,
    subtype: 'WEBSITE_HTTP',
    scheduleCron: '*/5 * * * *',
    ownershipScope: 'homelab',
    config: {},
  });

  const filtered = useMemo(
    () =>
      selectedCategory === 'ALL'
        ? monitors
        : monitors.filter((m) => m.categoryId === Number(selectedCategory)),
    [monitors, selectedCategory]
  );

  const handleCreate = async () => {
    setCreating(true);
    await fetch('/api/monitors', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...newMonitor, enabled: true }),
    });
    window.location.reload();
  };

  const handleToggle = async (monitorId: number, enabled: boolean) => {
    await fetch(`/api/monitors/${monitorId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ enabled }),
    });
    window.location.reload();
  };

  const handleTest = async (monitor: MonitorWithCategory) => {
    await fetch(`/api/monitors/${monitor.id}/test`, { method: 'POST' });
    alert('Test command queued for n8n.');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex gap-2 items-center">
          <label className="text-sm text-slate-300">Filter by category</label>
          <select
            className="bg-slate-800 border border-slate-700 rounded px-2 py-1 text-sm"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
          >
            <option value="ALL">All</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
        <button
          onClick={handleCreate}
          disabled={creating}
          className="bg-emerald-500 hover:bg-emerald-400 text-slate-900 px-4 py-2 rounded text-sm font-semibold disabled:opacity-60"
        >
          {creating ? 'Creating...' : 'Create monitor'}
        </button>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="card space-y-3">
          <div className="font-semibold">New monitor</div>
          <input
            className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-sm"
            placeholder="Name"
            value={newMonitor.name}
            onChange={(e) => setNewMonitor({ ...newMonitor, name: e.target.value })}
          />
          <div className="grid grid-cols-2 gap-2">
            <select
              className="bg-slate-800 border border-slate-700 rounded px-3 py-2 text-sm"
              value={newMonitor.categoryId}
              onChange={(e) => setNewMonitor({ ...newMonitor, categoryId: Number(e.target.value) })}
            >
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            <select
              className="bg-slate-800 border border-slate-700 rounded px-3 py-2 text-sm"
              value={newMonitor.subtype}
              onChange={(e) => setNewMonitor({ ...newMonitor, subtype: e.target.value })}
            >
              <option value="WEBSITE_HTTP">Website / Endpoint</option>
              <option value="DOCKER_SERVICE">Docker Service</option>
              <option value="PROXMOX_VM">Proxmox VM</option>
              <option value="CEPH_CLUSTER">Ceph</option>
              <option value="NETWORK_HOST">Network</option>
              <option value="CLOUDFLARE_TUNNEL">Cloudflare Tunnel</option>
              <option value="SUGGESTION">Draft</option>
            </select>
          </div>
          <input
            className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-sm"
            placeholder="Schedule cron"
            value={newMonitor.scheduleCron}
            onChange={(e) => setNewMonitor({ ...newMonitor, scheduleCron: e.target.value })}
          />
          <input
            className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-sm"
            placeholder="Ownership scope"
            value={newMonitor.ownershipScope}
            onChange={(e) => setNewMonitor({ ...newMonitor, ownershipScope: e.target.value })}
          />
          <MonitorFormFields
            subtype={newMonitor.subtype}
            onConfigChange={(config) => setNewMonitor({ ...newMonitor, config })}
          />
          <p className="text-xs text-slate-500">Config is validated server-side by subtype schemas.</p>
        </div>

        <div className="card">
          <table className="table">
            <thead className="text-xs uppercase text-slate-400">
              <tr>
                <th className="px-2 py-2">Name</th>
                <th className="px-2 py-2">Category</th>
                <th className="px-2 py-2">Enabled</th>
                <th className="px-2 py-2"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {filtered.map((monitor) => (
                <tr key={monitor.id}>
                  <td className="px-2 py-2">
                    <div className="font-medium">{monitor.name}</div>
                    <div className="text-xs text-slate-500">{monitor.subtype}</div>
                  </td>
                  <td className="px-2 py-2"><span className="badge badge-blue">{monitor.category.key}</span></td>
                  <td className="px-2 py-2">
                    <button
                      onClick={() => handleToggle(monitor.id, !monitor.enabled)}
                      className={`px-3 py-1 rounded text-xs font-semibold ${monitor.enabled ? 'bg-emerald-500 text-slate-900' : 'bg-slate-700 text-slate-200'}`}
                    >
                      {monitor.enabled ? 'Enabled' : 'Disabled'}
                    </button>
                  </td>
                  <td className="px-2 py-2 flex gap-2 justify-end">
                    <a className="text-emerald-400 text-sm" href={`/admin/monitors/${monitor.id}`}>Details</a>
                    <button onClick={() => handleTest(monitor)} className="text-sm text-slate-200 underline">Test</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
