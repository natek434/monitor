'use client';

import { MonitorRunStatus } from '@prisma/client';

type Props = {
  runs: { id: number; startedAt: string | Date; status: MonitorRunStatus }[];
};

const statusColor: Record<MonitorRunStatus, string> = {
  OK: '#22c55e',
  WARN: '#f59e0b',
  FAIL: '#ef4444',
};

export function RunHistoryChart({ runs }: Props) {
  const points = runs.map((run, idx) => ({
    x: idx * 40,
    y: run.status === 'OK' ? 20 : run.status === 'WARN' ? 45 : 70,
    status: run.status,
  }));

  return (
    <svg viewBox="0 0 400 100" className="w-full h-24 bg-slate-800 rounded-lg border border-slate-700">
      {points.map((p, idx) => (
        <circle key={idx} cx={p.x + 20} cy={p.y} r={6} fill={statusColor[p.status]} />
      ))}
    </svg>
  );
}
