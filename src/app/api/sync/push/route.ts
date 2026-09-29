import { NextRequest, NextResponse } from 'next/server';
import { getStore, bucketKey, isValidBucket, isSyncConfigured } from '@/app/lib/redis';

const COLLECTIONS = ['runs', 'tournaments', 'cards', 'uwUnlocked', 'uwSynced', 'stats', 'checks'] as const;

type Envelope = { updatedAt: number; data: unknown };

function validEnvelope(e: unknown): e is Envelope {
  if (typeof e !== 'object' || e === null) return false;
  const o = e as Record<string, unknown>;
  return typeof o.updatedAt === 'number' && 'data' in o;
}

/** Push a timestamped bundle. Per collection, newest timestamp wins. */
export async function POST(request: NextRequest) {
  if (!isSyncConfigured()) {
    return NextResponse.json({ error: 'Sync store is not configured on the server.' }, { status: 503 });
  }
  let body: { bucket?: unknown; bundle?: unknown };
  try {
    body = (await request.json()) as { bucket?: unknown; bundle?: unknown };
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }
  if (!isValidBucket(body.bucket)) {
    return NextResponse.json({ error: 'Missing or invalid bucket id.' }, { status: 400 });
  }
  if (typeof body.bundle !== 'object' || body.bundle === null) {
    return NextResponse.json({ error: 'Missing bundle object.' }, { status: 400 });
  }

  const store = getStore();
  if (!store) {
    return NextResponse.json({ error: 'Sync store is not configured on the server.' }, { status: 503 });
  }

  const bundle = body.bundle as Record<string, unknown>;
  const kept: Record<string, number> = {};
  for (const name of COLLECTIONS) {
    const incoming = bundle[name];
    if (!validEnvelope(incoming)) continue;
    const key = bucketKey(body.bucket, name);
    const current = await store.get<Envelope>(key);
    if (!current || !validEnvelope(current) || incoming.updatedAt >= current.updatedAt) {
      await store.set(key, incoming);
    }
    const final = await store.get<Envelope>(key);
    kept[name] = final && validEnvelope(final) ? final.updatedAt : incoming.updatedAt;
  }
  return NextResponse.json({ ok: true, kept });
}

export async function GET() {
  return NextResponse.json({
    usage: 'POST JSON { bucket, bundle: { <collection>: { updatedAt, data } } }',
    collections: [...COLLECTIONS],
    configured: isSyncConfigured(),
  });
}
