'use client';

import { useEffect, useMemo, useRef, useState } from 'react';

export type MonitorFormProps = {
  subtype: string;
  onConfigChange: (config: Record<string, unknown>) => void;
};

type InputMode = 'form' | 'json';
type ConfigShape = Record<string, any>;

export function MonitorFormFields({ subtype, onConfigChange }: MonitorFormProps) {
  const configTemplate = useMemo<ConfigShape>(() => {
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

  const [mode, setMode] = useState<InputMode>('form');
  const [config, setConfig] = useState<ConfigShape>(configTemplate);

  // JSON editor text + validity
  const [jsonValue, setJsonValue] = useState(() => JSON.stringify(configTemplate, null, 2));
  const [jsonError, setJsonError] = useState<string | null>(null);

  // Track whether user is actively editing JSON so we don't stomp their text.
  const jsonDirtyRef = useRef(false);

  // Reset on subtype change
  useEffect(() => {
    setConfig(configTemplate);
    setJsonValue(JSON.stringify(configTemplate, null, 2));
    setJsonError(null);
    jsonDirtyRef.current = false;
  }, [configTemplate]);

  // Single place we notify parent
  useEffect(() => {
    onConfigChange(config);
  }, [config, onConfigChange]);

  // When config changes from the form, update JSON text only if:
  // - user is not currently editing JSON OR
  // - we're not in JSON mode
  useEffect(() => {
    if (mode !== 'json' || !jsonDirtyRef.current) {
      setJsonValue(JSON.stringify(config, null, 2));
      setJsonError(null);
    }
  }, [config, mode]);

  const setField = (key: string, value: any) => {
    setConfig((prev) => ({ ...prev, [key]: value }));
  };

  const setThresholdField = (key: 'cpu' | 'memoryGb' | 'diskGb', value?: number) => {
    setConfig((prev) => {
      const thresholds = { ...(prev.thresholds || {}) };
      if (value === undefined || Number.isNaN(value)) delete thresholds[key];
      else thresholds[key] = value;
      return { ...prev, thresholds };
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
                  value={config.expectedStatus ?? 200}
                  onChange={(e) => setField('expectedStatus', e.target.value === '' ? undefined : Number(e.target.value))}
                />
              </label>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <label className="space-y-1 text-sm text-slate-200">
                <span className="text-xs uppercase tracking-wide text-slate-400">Timeout (ms)</span>
                <input
                  type="number"
                  className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-sm"
                  value={config.timeoutMs ?? 5000}
                  onChange={(e) => setField('timeoutMs', e.target.value === '' ? undefined : Number(e.target.value))}
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
                value={config.swarmServiceName ?? ''}
                onChange={(e) => setField('swarmServiceName', e.target.value)}
              />
            </label>

            <label className="space-y-1 text-sm text-slate-200">
              <span className="text-xs uppercase tracking-wide text-slate-400">Container name (fallback)</span>
              <input
                className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-sm"
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
                  value={config.expectedReplicas ?? 1}
                  onChange={(e) => setField('expectedReplicas', e.target.value === '' ? undefined : Number(e.target.value))}
                />
              </label>

              <label className="space-y-1 text-sm text-slate-200">
                <span className="text-xs uppercase tracking-wide text-slate-400">Max restarts allowed</span>
                <input
                  type="number"
                  className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-sm"
                  value={config.maxRestarts ?? 0}
                  onChange={(e) => setField('maxRestarts', e.target.value === '' ? undefined : Number(e.target.value))}
                />
              </label>
            </div>

            <label className="space-y-1 text-sm text-slate-200">
              <span className="text-xs uppercase tracking-wide text-slate-400">Node hint</span>
              <input
                className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-sm"
                value={config.nodeHint ?? ''}
                onChange={(e) => setField('nodeHint', e.target.value)}
              />
            </label>
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
                  value={config.nodeName ?? ''}
                  onChange={(e) => setField('nodeName', e.target.value)}
                />
              </label>

              <label className="space-y-1 text-sm text-slate-200">
                <span className="text-xs uppercase tracking-wide text-slate-400">VM ID</span>
                <input
                  type="number"
                  className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-sm"
                  value={config.vmId ?? 100}
                  onChange={(e) => setField('vmId', e.target.value === '' ? undefined : Number(e.target.value))}
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
                  value={config.thresholds?.cpu ?? ''}
                  onChange={(e) => setThresholdField('cpu', e.target.value ? Number(e.target.value) : undefined)}
                />
              </label>
              <label className="space-y-1 text-sm text-slate-200">
                <span className="text-xs uppercase tracking-wide text-slate-400">Memory GB threshold</span>
                <input
                  type="number"
                  className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-sm"
                  value={config.thresholds?.memoryGb ?? ''}
                  onChange={(e) => setThresholdField('memoryGb', e.target.value ? Number(e.target.value) : undefined)}
                />
              </label>
              <label className="space-y-1 text-sm text-slate-200">
                <span className="text-xs uppercase tracking-wide text-slate-400">Disk GB threshold</span>
                <input
                  type="number"
                  className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-sm"
                  value={config.thresholds?.diskGb ?? ''}
                  onChange={(e) => setThresholdField('diskGb', e.target.value ? Number(e.target.value) : undefined)}
                />
              </label>
            </div>
          </div>
        );

      // CEPH_CLUSTER, NETWORK_HOST, CLOUDFLARE_TUNNEL cases identical to yours (just call setField)
      default:
        return (
          <label className="space-y-1 text-sm text-slate-200">
            <span className="text-xs uppercase tracking-wide text-slate-400">Draft notes</span>
            <textarea
              className="w-full rounded border border-slate-700 bg-slate-800 p-2 text-sm"
              rows={4}
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
            onClick={() => {
              jsonDirtyRef.current = false;
              setMode('form');
            }}
          >
            Guided form
          </button>

          <button
            type="button"
            className={`px-2 py-1 rounded border ${mode === 'json' ? 'border-emerald-400 text-emerald-300' : 'border-slate-700 text-slate-300'}`}
            onClick={() => {
              jsonDirtyRef.current = false;
              setJsonValue(JSON.stringify(config, null, 2));
              setJsonError(null);
              setMode('json');
            }}
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
        <div className="space-y-2">
          <textarea
            className="w-full rounded border border-slate-700 bg-slate-800 p-2 text-sm font-mono"
            rows={10}
            value={jsonValue}
            onChange={(e) => {
              const value = e.target.value;
              jsonDirtyRef.current = true;
              setJsonValue(value);

              try {
                const parsed = JSON.parse(value);
                setJsonError(null);
                setConfig(parsed); // parent gets update via config effect
              } catch (err: any) {
                setJsonError('Invalid JSON (fix the syntax to apply changes).');
              }
            }}
          />

          {jsonError && <p className="text-xs text-rose-300">{jsonError}</p>}
          {!jsonError && <p className="text-[11px] text-slate-500">Valid JSON. Changes apply immediately.</p>}
        </div>
      )}
    </div>
  );
}
