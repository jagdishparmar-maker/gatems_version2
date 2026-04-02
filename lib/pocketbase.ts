import PocketBase from 'pocketbase';

const DEFAULT_URL = 'https://pocketbase.intoship.cloud';

function getBaseUrl(): string {
  const raw = process.env.NEXT_PUBLIC_POCKETBASE_URL?.trim();
  if (!raw) return DEFAULT_URL;
  return raw.replace(/\/$/, '');
}

export const pb = new PocketBase(getBaseUrl());
