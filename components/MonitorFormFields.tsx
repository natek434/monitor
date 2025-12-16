'use client';

import { useMemo } from 'react';

export type MonitorFormProps = {
  subtype: string;
  onConfigChange: (config: Record<string, unknown>) => void;
};

export function MonitorFormFields({ subtype, onConfigChange }: MonitorFormProps) {
  const configTemplate = useMemo(() => {
    switch (subtype) {
      case 'WEBSITE_HTTP':
        return { url: '', method: 'GET', expectedStatus: 200, timeoutMs: 5000, followRedirects: true };
      case 'DOCKER_SERVICE':
        return { swarmServiceName: '', containerName: '', nodeHint: '', expectedReplicas: 1, maxRestarts: 0 };
      case 'PROXMOX_VM':
        return { nodeName: '', vmId: 100, expectedState: 'running', thresholds: { cpu: 90, memoryGb: 32, diskGb: 100 } };
      case 'CEPH_CLUSTER':
        return { clusterName: '', healthThreshold: 'HEALTH_OK', poolName: '' };
      case 'NETWORK_HOST':
        return { targetHost: '', pingCount: 4, dnsName: '', gatewayIp: '' };
      case 'CLOUDFLARE_TUNNEL':
        return { tunnelName: '', hostname: '', expectedTlsDaysRemaining: 10 };
      default:
        return { note: '' };
    }
  }, [subtype]);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs text-slate-400">
        <p>Provide configuration for subtype: {subtype}</p>
        <span className="text-[11px] text-slate-500">Use the hint template to keep keys aligned with validation.</span>
      </div>
      <textarea
        className="w-full rounded border border-slate-700 bg-slate-800 p-2 text-sm"
        rows={8}
        defaultValue={JSON.stringify(configTemplate, null, 2)}
        placeholder="Fill in monitor config JSON. For example: { \"url\": \"https://status.example.com\", \"expectedStatus\": 200 }"
        onChange={(e) => {
          try {
            const parsed = JSON.parse(e.target.value);
            onConfigChange(parsed);
          } catch (err) {
            onConfigChange({});
          }
        }}
      />
    </div>
  );
}
