import type { RecordModel } from 'pocketbase';
import type { NotificationSoundKind } from '@/lib/notification-sound';

export type VehicleToastVariant = 'info' | 'success' | 'warning';

export type VehicleToastPayload = {
  title: string;
  description?: string;
  variant: VehicleToastVariant;
  sound: NotificationSoundKind;
};

export type { NotificationSoundKind };

function vehicleLabel(record: RecordModel): string {
  return (record.vehicleno as string) || 'Vehicle';
}

/**
 * Build a toast + sound for PocketBase vehicle subscription events.
 * Skips noisy updates when `status` is unchanged.
 */
export function notificationFromVehicleEvent(
  action: 'create' | 'update' | 'delete',
  record: RecordModel,
  previousStatus: string | undefined
): VehicleToastPayload | null {
  if (action === 'delete') {
    return null;
  }

  const label = vehicleLabel(record);
  const status = (record.status as string) || '';
  const dock = record.Assigned_Dock as number | undefined;

  if (action === 'create') {
    if (status === 'CheckedOut') return null;
    return {
      title: 'Checked in',
      description: `${label} · ${(record.Transport as string) || 'Yard'}`,
      variant: 'success',
      sound: 'checkin',
    };
  }

  // update
  if (previousStatus === undefined) {
    return null;
  }

  if (previousStatus === status) {
    return null;
  }

  if (status === 'CheckedOut') {
    return {
      title: 'Checked out',
      description: label,
      variant: 'info',
      sound: 'checkout',
    };
  }

  if (status === 'DockedIn') {
    const dockStr =
      typeof dock === 'number' && dock > 0
        ? ` · Dock ${String(dock).padStart(2, '0')}`
        : '';
    return {
      title: 'Docked in',
      description: `${label}${dockStr}`,
      variant: 'success',
      sound: 'dock',
    };
  }

  if (status === 'DockedOut' && previousStatus === 'DockedIn') {
    return {
      title: 'Ready to exit',
      description: `${label} — left loading dock`,
      variant: 'warning',
      sound: 'ready',
    };
  }

  if (status === 'CheckedIn') {
    return {
      title: 'In yard',
      description: label,
      variant: 'info',
      sound: 'checkin',
    };
  }

  return {
    title: 'Status update',
    description: `${label} → ${status}`,
    variant: 'info',
    sound: 'checkin',
  };
}
