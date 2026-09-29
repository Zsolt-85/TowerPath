import { Redis } from '@upstash/redis';

let client: Redis | null = null;

export function isSyncConfigured(): boolean {
  return Boolean(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN);
}

export function getStore(): Redis | null {
  if (!isSyncConfigured()) return null;
  if (!client) {
    client = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL as string,
      token: process.env.UPSTASH_REDIS_REST_TOKEN as string,
    });
  }
  return client;
}

export function bucketKey(bucket: string, collection: string): string {
  return `towerpath:${bucket}:${collection}`;
}

export function isValidBucket(b: unknown): b is string {
  return typeof b === 'string' && /^[0-9a-f]{64}$/.test(b);
}
