import type { RecordModel } from 'pocketbase';

/**
 * PocketBase `users` record: prefer name, then username, then email local-part.
 */
export function displayNameFromUserRecord(
  user: RecordModel | undefined | null
): string | null {
  if (!user) return null;
  const name = String(user.name ?? '').trim();
  if (name) return name;
  const username = String(user.username ?? '').trim();
  if (username) return username;
  const email = String(user.email ?? '').trim();
  if (email) {
    const local = email.split('@')[0];
    return local || email;
  }
  return null;
}

/** Expand keys for vehicle → users relations (must match PocketBase field names). */
export const VEHICLE_USER_EXPAND = 'Checked_In_By,Checked_Out_By';

/**
 * Resolve Checked_In_By / Checked_Out_By to a readable label using `expand` when present.
 */
export function resolveVehicleUserField(
  item: RecordModel,
  field: 'Checked_In_By' | 'Checked_Out_By'
): string {
  const expand = item.expand as Record<string, RecordModel> | undefined;
  const user = expand?.[field];
  const label = displayNameFromUserRecord(user);
  if (label) return label;

  const raw = item[field];
  if (raw !== undefined && raw !== null && String(raw).trim() !== '') {
    return String(raw);
  }
  return 'N/A';
}
