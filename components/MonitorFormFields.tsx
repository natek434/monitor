'use client';

import { useEffect, useMemo, useState } from 'react';

export type MonitorFormProps = {
  subtype: string;
  onConfigChange: (config: Record<string, unknown>) => void;
};

type InputMode = 'form' | 'json';

type ConfigShape = Record<string, any>;

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

  const [config, setConfig] = useState<ConfigShape>(configTemplate);
  const [mode, setMode] = useState<InputMode>('form');
  const [jsonValue, setJsonValue] = useState(JSON.stringify(configTemplate, null, 2));

  useEffect(() => {
    setConfig(configTemplate);
    setJsonValue(JSON.stringify(configTemplate, null, 2));
    onConfigChange(configTemplate);
  }, [configTemplate, onConfigChange]);

  useEffect(() => {
    setJsonValue(JSON.stringify(config, null, 2));
  }, [config]);

  const setField = (key: string, value: any) => {
    setConfig((prev) => {
      const next = { ...prev, [key]: value };
      onConfigChange(next);
      return next;
    });
  };

  const setThresholdField = (key: 'cpu' | 'memoryGb' | 'diskGb', value?: number) => {
    setConfig((prev) => {
      const thresholds = { ...(prev.thresholds || {}) };
      if (value === undefined || Number.isNaN(value)) {
        delete thresholds[key];
      } else {
        thresholds[key] = value;
      }
      const next = { ...prev, thresholds };
      onConfigChange(next);
      return next;
    });
  };

  const renderForm = () => {
    switch (subtype) {
      case 'WEBSITE_HTTP':
        return (
          <div className="space-y-3">
            <label className="space-y-1 text-sm text-slate-200">
              <span className="text-xs uppercase tracking-wide text-slate-400">URL</span>
              <input
                className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-sm"
                placeholder="https://status.example.com/health"
                value={config.url ?? ''}
                onChange={(e) => setField('url', e.target.value)}
              />
            </label>
            <div className="grid grid-cols-2 gap-2">
              <label className="space-y-1 text-sm text-slate-200">
                <span className="text-xs uppercase tracking-wide text-slate-400">Method</span>
                <select
                  className="bg-slate-800 border border-slate-700 rounded px-3 py-2 text-sm"
                  value={config.method ?? 'GET'}
                  onChange={(e) => setField('method', e.target.value)}
                >
                  <option value="GET">GET</option>
                  <option value="POST">POST</option>
                  <option value="HEAD">HEAD</option>
                </select>
              </label>
              <label className="space-y-1 text-sm text-slate-200">
                <span className="text-xs uppercase tracking-wide text-slate-400">Expected status</span>
                <input
                  type="number"
                  className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-sm"
                  placeholder="200"
                  value={config.expectedStatus ?? 200}
                  onChange={(e) => setField('expectedStatus', Number(e.target.value))}
                />
              </label>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <label className="space-y-1 text-sm text-slate-200">
                <span className="text-xs uppercase tracking-wide text-slate-400">Timeout (ms)</span>
                <input
                  type="number"
                  className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-sm"
                  placeholder="5000"
                  value={config.timeoutMs ?? 5000}
                  onChange={(e) => setField('timeoutMs', Number(e.target.value))}
                />
              </label>
              <label className="flex items-center gap-2 text-sm text-slate-200 pt-5">
                <input
                  type="checkbox"
                  checked={!!config.followRedirects}
                  onChange={(e) => setField('followRedirects', e.target.checked)}
                />
                <span className="text-xs uppercase tracking-wide text-slate-400">Follow redirects</span>
              </label>
            </div>
          </div>
        );

      case 'DOCKER_SERVICE':
        return (
          <div className="space-y-3">
            <label className="space-y-1 text-sm text-slate-200">
              <span className="text-xs uppercase tracking-wide text-slate-400">Swarm service name</span>
              <input
                className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-sm"
                placeholder="frontend_web"
                value={config.swarmServiceName ?? ''}
                onChange={(e) => setField('swarmServiceName', e.target.value)}
              />
            </label>
            <label className="space-y-1 text-sm text-slate-200">
              <span className="text-xs uppercase tracking-wide text-slate-400">Container name (fallback)</span>
              <input
                className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-sm"
                placeholder="web_1"
                value={config.containerName ?? ''}
                onChange={(e) => setField('containerName', e.target.value)}
              />
            </label>
            <div className="grid grid-cols-2 gap-2">
              <label className="space-y-1 text-sm text-slate-200">
                <span className="text-xs uppercase tracking-wide text-slate-400">Expected replicas</span>
                <input
                  type="number"
                  className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-sm"
                  placeholder="1"
                  value={config.expectedReplicas ?? 1}
                  onChange={(e) => setField('expectedReplicas', Number(e.target.value))}
                />
              </label>
              <label className="space-y-1 text-sm text-slate-200">
                <span className="text-xs uppercase tracking-wide text-slate-400">Max restarts allowed</span>
                <input
                  type="number"
                  className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-sm"
                  placeholder="0"
                  value={config.maxRestarts ?? 0}
                  onChange={(e) => setField('maxRestarts', Number(e.target.value))}
                />
              </label>
            </div>
            <label className="space-y-1 text-sm text-slate-200">
              <span className="text-xs uppercase tracking-wide text-slate-400">Node hint</span>
              <input
                className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-sm"
                placeholder="swarm-manager-01"
                value={config.nodeHint ?? ''}
                onChange={(e) => setField('nodeHint', e.target.value)}
              />
            </label>
            <p className="text-xs text-slate-400">Provide either Swarm service or container name; both optional fields are allowed but at least one is required.</p>
          </div>
        );

      case 'PROXMOX_VM':
        return (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <label className="space-y-1 text-sm text-slate-200">
                <span className="text-xs uppercase tracking-wide text-slate-400">Node name</span>
                <input
                  className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-sm"
                  placeholder="pve01"
                  value={config.nodeName ?? ''}
                  onChange={(e) => setField('nodeName', e.target.value)}
                />
              </label>
              <label className="space-y-1 text-sm text-slate-200">
                <span className="text-xs uppercase tracking-wide text-slate-400">VM ID</span>
                <input
                  type="number"
                  className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-sm"
                  placeholder="100"
                  value={config.vmId ?? 100}
                  onChange={(e) => setField('vmId', Number(e.target.value))}
                />
              </label>
            </div>
            <label className="space-y-1 text-sm text-slate-200">
              <span className="text-xs uppercase tracking-wide text-slate-400">Expected state</span>
              <select
                className="bg-slate-800 border border-slate-700 rounded px-3 py-2 text-sm"
                value={config.expectedState ?? 'running'}
                onChange={(e) => setField('expectedState', e.target.value)}
              >
                <option value="running">Running</option>
                <option value="stopped">Stopped</option>
              </select>
            </label>
            <div className="grid grid-cols-3 gap-2">
              <label className="space-y-1 text-sm text-slate-200">
                <span className="text-xs uppercase tracking-wide text-slate-400">CPU % threshold</span>
                <input
                  type="number"
                  className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-sm"
                  placeholder="90"
                  value={config.thresholds?.cpu ?? ''}
                  onChange={(e) => setThresholdField('cpu', e.target.value ? Number(e.target.value) : undefined)}
                />
              </label>
              <label className="space-y-1 text-sm text-slate-200">
                <span className="text-xs uppercase tracking-wide text-slate-400">Memory GB threshold</span>
                <input
                  type="number"
                  className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-sm"
                  placeholder="32"
                  value={config.thresholds?.memoryGb ?? ''}
                  onChange={(e) => setThresholdField('memoryGb', e.target.value ? Number(e.target.value) : undefined)}
                />
              </label>
              <label className="space-y-1 text-sm text-slate-200">
                <span className="text-xs uppercase tracking-wide text-slate-400">Disk GB threshold</span>
                <input
                  type="number"
                  className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-sm"
                  placeholder="100"
                  value={config.thresholds?.diskGb ?? ''}
                  onChange={(e) => setThresholdField('diskGb', e.target.value ? Number(e.target.value) : undefined)}
                />
              </label>
            </div>
          </div>
        );

      case 'CEPH_CLUSTER':
        return (
          <div className="space-y-3">
            <label className="space-y-1 text-sm text-slate-200">
              <span className="text-xs uppercase tracking-wide text-slate-400">Cluster name</span>
              <input
                className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-sm"
                placeholder="ceph-homelab"
                value={config.clusterName ?? ''}
                onChange={(e) => setField('clusterName', e.target.value)}
              />
            </label>
            <label className="space-y-1 text-sm text-slate-200">
              <span className="text-xs uppercase tracking-wide text-slate-400">Health threshold</span>
              <select
                className="bg-slate-800 border border-slate-700 rounded px-3 py-2 text-sm"
                value={config.healthThreshold ?? 'HEALTH_OK'}
                onChange={(e) => setField('healthThreshold', e.target.value)}
              >
                <option value="HEALTH_OK">HEALTH_OK</option>
                <option value="HEALTH_WARN">HEALTH_WARN</option>
                <option value="HEALTH_ERR">HEALTH_ERR</option>
              </select>
            </label>
            <label className="space-y-1 text-sm text-slate-200">
              <span className="text-xs uppercase tracking-wide text-slate-400">Pool name (optional)</span>
              <input
                className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-sm"
                placeholder="cephfs_data"
                value={config.poolName ?? ''}
                onChange={(e) => setField('poolName', e.target.value)}
              />
            </label>
          </div>
        );

      case 'NETWORK_HOST':
        return (
          <div className="space-y-3">
            <label className="space-y-1 text-sm text-slate-200">
              <span className="text-xs uppercase tracking-wide text-slate-400">Target host or IP</span>
              <input
                className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-sm"
                placeholder="gateway.local or 192.168.1.1"
                value={config.targetHost ?? ''}
                onChange={(e) => setField('targetHost', e.target.value)}
              />
            </label>
            <div className="grid grid-cols-2 gap-2">
              <label className="space-y-1 text-sm text-slate-200">
                <span className="text-xs uppercase tracking-wide text-slate-400">Ping count</span>
                <input
                  type="number"
                  className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-sm"
                  placeholder="4"
                  value={config.pingCount ?? 4}
                  onChange={(e) => setField('pingCount', Number(e.target.value))}
                />
              </label>
              <label className="space-y-1 text-sm text-slate-200">
                <span className="text-xs uppercase tracking-wide text-slate-400">Gateway IP (optional)</span>
                <input
                  className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-sm"
                  placeholder="192.168.1.1"
                  value={config.gatewayIp ?? ''}
                  onChange={(e) => setField('gatewayIp', e.target.value)}
                />
              </label>
            </div>
            <label className="space-y-1 text-sm text-slate-200">
              <span className="text-xs uppercase tracking-wide text-slate-400">DNS name (optional)</span>
              <input
                className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-sm"
                placeholder="example.com"
                value={config.dnsName ?? ''}
                onChange={(e) => setField('dnsName', e.target.value)}
              />
            </label>
          </div>
        );

      case 'CLOUDFLARE_TUNNEL':
        return (
          <div className="space-y-3">
            <label className="space-y-1 text-sm text-slate-200">
              <span className="text-xs uppercase tracking-wide text-slate-400">Tunnel name</span>
              <input
                className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-sm"
                placeholder="public-app-tunnel"
                value={config.tunnelName ?? ''}
                onChange={(e) => setField('tunnelName', e.target.value)}
              />
            </label>
            <label className="space-y-1 text-sm text-slate-200">
              <span className="text-xs uppercase tracking-wide text-slate-400">Hostname</span>
              <input
                className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-sm"
                placeholder="status.example.com"
                value={config.hostname ?? ''}
                onChange={(e) => setField('hostname', e.target.value)}
              />
            </label>
            <label className="space-y-1 text-sm text-slate-200">
              <span className="text-xs uppercase tracking-wide text-slate-400">Expected TLS days remaining</span>
              <input
                type="number"
                className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-sm"
                placeholder="10"
                value={config.expectedTlsDaysRemaining ?? 10}
                onChange={(e) => setField('expectedTlsDaysRemaining', Number(e.target.value))}
              />
            </label>
          </div>
        );

      default:
        return (
          <label className="space-y-1 text-sm text-slate-200">
            <span className="text-xs uppercase tracking-wide text-slate-400">Draft notes</span>
            <textarea
              className="w-full rounded border border-slate-700 bg-slate-800 p-2 text-sm"
              rows={4}
              placeholder="Describe the monitor you want the admin to review"
              value={config.note ?? ''}
              onChange={(e) => setField('note', e.target.value)}
            />
          </label>
        );
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-xs text-slate-400">
        <div className="flex items-center gap-2">
          <p>Provide configuration for subtype: {subtype}</p>
          <span className="text-[11px] text-slate-500">Switch between guided form and raw JSON.</span>
        </div>
        <div className="flex gap-2 text-[11px]">
          <button
            type="button"
            className={`px-2 py-1 rounded border ${mode === 'form' ? 'border-emerald-400 text-emerald-300' : 'border-slate-700 text-slate-300'}`}
            onClick={() => setMode('form')}
          >
            Guided form
          </button>
          <button
            type="button"
            className={`px-2 py-1 rounded border ${mode === 'json' ? 'border-emerald-400 text-emerald-300' : 'border-slate-700 text-slate-300'}`}
            onClick={() => setMode('json')}
          >
            JSON editor
          </button>
        </div>
      </div>

      {mode === 'form' && (
        <div className="rounded border border-slate-700 bg-slate-900/60 p-3 space-y-3">
          {renderForm()}
          <p className="text-[11px] text-slate-500">All values map directly to the subtype validation schema.</p>
        </div>
      )}

      {mode === 'json' && (
        <textarea
          className="w-full rounded border border-slate-700 bg-slate-800 p-2 text-sm"
          rows={10}
          value={jsonValue}
          placeholder="Fill in monitor config JSON. For example: { \"url\": \"https://status.example.com\", \"expectedStatus\": 200 }"
          onChange={(e) => {
            setJsonValue(e.target.value);
            try {
              const parsed = JSON.parse(e.target.value);
              setConfig(parsed);
              onConfigChange(parsed);
            } catch (err) {
              // Keep the last valid config in state; invalid JSON will not update config
            }
          }}
        />
      )}
    </div>
  );
}
