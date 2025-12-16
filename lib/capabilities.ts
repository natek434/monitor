export const capabilityByCategory: Record<string, string[]> = {
  WEBSITE: ['HTTP_GET', 'TLS_CHECK'],
  DOCKER: ['DOCKER_API_READ'],
  PROXMOX: ['PROXMOX_API_READ'],
  CEPH: ['CEPH_STATUS_READ'],
  NETWORK: ['ICMP_PING', 'DNS_LOOKUP'],
  CLOUDFLARE: ['CLOUDFLARE_API_READ'],
};

export function isCapabilityAllowed(categoryKey: string, capability: string) {
  const allowed = capabilityByCategory[categoryKey] ?? [];
  return allowed.includes(capability);
}
