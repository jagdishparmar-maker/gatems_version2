import type { RecordModel } from 'pocketbase';
import { pb } from '@/lib/pocketbase';
import type { Vehicle } from '@/types/vehicle';
import { formatDateTime } from '@/lib/vehicle-utils';

type MapOptions = {
  /** When true, CheckedOut maps to ready_to_exit (history). Default false uses live-dashboard mapping. */
  includeCheckedOut?: boolean;
};

export function mapVehicleRecord(
  item: RecordModel,
  options: MapOptions = {}
): Vehicle {
  const { includeCheckedOut = false } = options;

  let mappedStatus: Vehicle['status'] = 'parked';
  if (item.status === 'DockedIn') {
    mappedStatus = item.Type === 'Inward' ? 'unloading' : 'loading';
  } else if (item.status === 'DockedOut') {
    mappedStatus = 'ready_to_exit';
  } else if (item.status === 'CheckedIn') {
    mappedStatus = 'parked';
  } else if (includeCheckedOut && item.status === 'CheckedOut') {
    mappedStatus = 'ready_to_exit';
  }

  const progress =
    item.status === 'DockedIn' ? (includeCheckedOut ? 100 : 45) : 0;

  return {
    id: item.id,
    vehicleNo: item.vehicleno || 'N/A',
    transport: item.Transport || 'N/A',
    customer: item.Customer || 'N/A',
    checkedInTime: formatDateTime(item.Check_In_Date),
    checkOutDate: formatDateTime(item.Check_Out_Date),
    size: 'medium',
    status: mappedStatus,
    rawStatus: item.status || 'N/A',
    type: item.Type === 'Inward' ? 'Inward' : 'Outward',
    chargeLevel: 0,
    progress,
    assignedDock: item.Assigned_Dock ?? 0,
    driverName: item.Driver_Name || 'N/A',
    driverPhone: item.Contact_No || 'N/A',
    containerNo: item.Container_No || 'N/A',
    weight: item.Weight || 'N/A',
    origin: item.Origin || 'N/A',
    destination: item.Destination || 'N/A',
    imageUrl: item.image ? pb.files.getURL(item, item.image) : undefined,
    dockInDateTime: formatDateTime(item.Dock_In_DateTime),
    dockOutDateTime: formatDateTime(item.Dock_Out_DateTime),
    remarks: item.Remarks || 'N/A',
    checkedInBy: item.Checked_In_By || 'N/A',
    checkedOutBy: item.Checked_Out_By || 'N/A',
    created: formatDateTime(item.created),
    updated: formatDateTime(item.updated),
    rawCheckInDate: item.Check_In_Date,
    rawCheckOutDate: item.Check_Out_Date,
    rawDockInDate: item.Dock_In_DateTime,
    rawDockOutDate: item.Dock_Out_DateTime,
  };
}
