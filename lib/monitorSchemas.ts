import { z } from 'zod';

export const MonitorCategoryKey = {
  WEBSITE: 'WEBSITE',
  DOCKER: 'DOCKER',
  PROXMOX: 'PROXMOX',
  CEPH: 'CEPH',
  NETWORK: 'NETWORK',
  CLOUDFLARE: 'CLOUDFLARE',
} as const;

const baseDraft = z.object({ note: z.string().min(1) });

const websiteSchema = z.object({
  url: z.string().url(),
  method: z.enum(['GET', 'POST', 'HEAD']).default('GET'),
  expectedStatus: z.number().int().min(100).max(599),
  timeoutMs: z.number().int().min(100).max(120000),
  followRedirects: z.boolean().default(true),
});

const dockerSchema = z.object({
  swarmServiceName: z.string().optional(),
  containerName: z.string().optional(),
  nodeHint: z.string().optional(),
  expectedReplicas: z.number().int().min(0),
  maxRestarts: z.number().int().min(0).default(0),
}).refine((data) => data.swarmServiceName || data.containerName, {
  message: 'swarmServiceName or containerName is required',
});

const proxmoxSchema = z.object({
  nodeName: z.string().min(1),
  vmId: z.number().int().min(1),
  expectedState: z.enum(['running', 'stopped']),
  thresholds: z.object({
    cpu: z.number().min(0).max(100).optional(),
    memoryGb: z.number().min(0).optional(),
    diskGb: z.number().min(0).optional(),
  }),
});

const cephSchema = z.object({
  clusterName: z.string().min(1),
  healthThreshold: z.enum(['HEALTH_OK', 'HEALTH_WARN', 'HEALTH_ERR']),
  poolName: z.string().optional(),
});

const networkSchema = z.object({
  targetHost: z.string().min(1),
  pingCount: z.number().int().min(1).max(10),
  dnsName: z.string().optional(),
  gatewayIp: z.string().optional(),
});

const cloudflareSchema = z.object({
  tunnelName: z.string().min(1),
  hostname: z.string().min(1),
  expectedTlsDaysRemaining: z.number().int().min(0),
});

export const subtypeSchemas: Record<string, z.ZodSchema> = {
  WEBSITE_HTTP: websiteSchema,
  DOCKER_SERVICE: dockerSchema,
  PROXMOX_VM: proxmoxSchema,
  CEPH_CLUSTER: cephSchema,
  NETWORK_HOST: networkSchema,
  CLOUDFLARE_TUNNEL: cloudflareSchema,
  SUGGESTION: baseDraft,
};

export type SupportedSubtype = keyof typeof subtypeSchemas;

export function validateConfig(subtype: string, config: unknown) {
  const schema = subtypeSchemas[subtype];
  if (!schema) {
    throw new Error(`Unsupported subtype ${subtype}`);
  }
  return schema.parse(config);
}
