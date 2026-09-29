import { NextRequest, NextResponse } from 'next/server';
import { getStore, bucketKey, isValidBucket, isSyncConfigured } from '@/app/lib/redis';

const COLLECTIONS = ['runs', 'tournaments', 'cards', 'uwUnlocked', 'uwSynced', 'stats', 'checks'] as const;

/** Pull the stored bundle for a bucket. 404 when the bucket was never pushed to. */
export async function GET(request: NextRequest) {
  if (!isSyncConfigured()) {
    return NextResponse.json({ error: 'Sync store is not configured on the server.' }, { status: 503 });
  }
  const bucket = request.nextUrl.searchParams.get('bucket');
  if (!isValidBucket(bucket)) {
    return NextResponse.json({ error: 'Missing or invalid bucket id.' }, { status: 400 });
  }
  const store = getStore();
  if (!store) {
    return NextResponse.json({ error: 'Sync store is not configured on the server.' }, { status: 503 });
  }
  const bundle: Record<string, unknown> = {};
  let found = false;
  for (const name of COLLECTIONS) {
    const value = await store.get(bucketKey(bucket, name));
    if (value !== null && value !== undefined) {
      bundle[name] = value;
      found = true;
    }
  }
  if (!found) {
    return NextResponse.json({ empty: true }, { status: 404 });
  }
  return NextResponse.json({ bundle });
}
