'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import VehicleCard from '@/components/VehicleCard';
import VehicleDetailModal from '@/components/VehicleDetailModal';
import VehicleToastStack, {
  type ToastItem,
} from '@/components/VehicleToastStack';
import {
  Truck,
  Loader2,
  History as HistoryIcon,
  LogOut,
  RefreshCw,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { pb } from '@/lib/pocketbase';
import { mapVehicleRecord } from '@/lib/vehicle-mapper';
import { VEHICLE_USER_EXPAND } from '@/lib/user-display';
import {
  notificationFromVehicleEvent,
  type VehicleToastPayload,
} from '@/lib/vehicle-realtime-notify';
import { playNotificationSound } from '@/lib/notification-sound';
import { useAuth } from '@/components/AuthProvider';
import type { Vehicle } from '@/types/vehicle';

interface Dock {
  id: number;
  status: 'available' | 'occupied' | 'maintenance';
  vehicle: Vehicle | null;
}

export default function Page() {
  const { logout } = useAuth();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const statusSnapshotRef = useRef<Map<string, string>>(new Map());

  const pushVehicleNotification = useCallback((payload: VehicleToastPayload) => {
    const id =
      typeof crypto !== 'undefined' && crypto.randomUUID
        ? crypto.randomUUID()
        : `toast-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const { sound, ...rest } = payload;
    setToasts((prev) => [...prev, { id, ...rest }]);
    playNotificationSound(sound);
    window.setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 6000);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const loadVehicles = useCallback(async (isManualRefresh: boolean) => {
    try {
      if (isManualRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const records = await pb.collection('vehicles').getFullList({
        filter: "status!='CheckedOut'",
        requestKey: null,
        expand: VEHICLE_USER_EXPAND,
      });

      statusSnapshotRef.current.clear();
      records.forEach((r) => {
        statusSnapshotRef.current.set(
          r.id,
          ((r as { status?: string }).status as string) || ''
        );
      });

      const mappedVehicles: Vehicle[] = records.map((item) =>
        mapVehicleRecord(item)
      );
      setVehicles(mappedVehicles);
      setError(null);
    } catch (err: unknown) {
      const e = err as { isAbort?: boolean };
      if (e.isAbort) return;

      console.error('Error fetching vehicles:', err);
      setError('Failed to load real-time vehicle data. Please try again later.');
    } finally {
      if (isManualRefresh) {
        setRefreshing(false);
      } else {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    void loadVehicles(false);

    pb.collection('vehicles').subscribe('*', async (e) => {
      const fetchExpandedVehicle = async (id: string) => {
        try {
          return await pb.collection('vehicles').getOne(id, {
            expand: VEHICLE_USER_EXPAND,
            requestKey: null,
          });
        } catch {
          return e.record;
        }
      };

      if (e.action === 'create') {
        if (e.record.status === 'CheckedOut') {
          return;
        }
        const toastPayload = notificationFromVehicleEvent(
          'create',
          e.record,
          undefined
        );
        if (toastPayload) {
          pushVehicleNotification(toastPayload);
        }
        statusSnapshotRef.current.set(
          e.record.id,
          ((e.record as { status?: string }).status as string) || ''
        );
        const record = await fetchExpandedVehicle(e.record.id);
        setVehicles((prev) => [...prev, mapVehicleRecord(record)]);
      } else if (e.action === 'update') {
        const prevStatus = statusSnapshotRef.current.get(e.record.id);
        const toastPayload = notificationFromVehicleEvent(
          'update',
          e.record,
          prevStatus
        );
        if (toastPayload) {
          pushVehicleNotification(toastPayload);
        }

        if (e.record.status === 'CheckedOut') {
          statusSnapshotRef.current.delete(e.record.id);
          setVehicles((prev) => prev.filter((v) => v.id !== e.record.id));
        } else {
          statusSnapshotRef.current.set(
            e.record.id,
            ((e.record as { status?: string }).status as string) || ''
          );
          const record = await fetchExpandedVehicle(e.record.id);
          setVehicles((prev) => {
            const index = prev.findIndex((v) => v.id === e.record.id);
            if (index !== -1) {
              const newVehicles = [...prev];
              newVehicles[index] = mapVehicleRecord(record);
              return newVehicles;
            }
            return [...prev, mapVehicleRecord(record)];
          });
        }
      } else if (e.action === 'delete') {
        statusSnapshotRef.current.delete(e.record.id);
        setVehicles((prev) => prev.filter((v) => v.id !== e.record.id));
      }
    });

    return () => {
      pb.collection('vehicles').unsubscribe('*');
    };
  }, [loadVehicles, pushVehicleNotification]);

  const parkedVehicles = vehicles.filter(v => v.assignedDock === 0 && v.status !== 'ready_to_exit');
  const inwardParkedVehicles = parkedVehicles.filter(v => v.type === 'Inward');
  const outwardParkedVehicles = parkedVehicles.filter(v => v.type === 'Outward');
  const exitVehicles = vehicles.filter(v => v.status === 'ready_to_exit');
  
  // Construct Docks (10 slots)
  const docks: Dock[] = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(id => {
    const vehicleAtDock = vehicles.find(v => v.assignedDock === id);
    return {
      id,
      status: vehicleAtDock ? 'occupied' : 'available',
      vehicle: vehicleAtDock || null
    };
  });

  if (loading && vehicles.length === 0) {
    return (
      <div className="min-h-screen bg-zinc-50 flex flex-col items-center justify-center gap-4">
        <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
        <p className="text-zinc-500 font-bold uppercase tracking-widest text-xs">Initializing GateMS...</p>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-zinc-50 py-3 px-4 sm:px-6 lg:px-8 relative overflow-hidden font-sans">
      <VehicleToastStack toasts={toasts} onDismiss={dismissToast} />
      {/* Atmospheric Background Glows - Subtler for Light Theme */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-blue-500/[0.03] rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-indigo-500/[0.03] rounded-full blur-[100px] pointer-events-none" />

      <div className="max-w-[1600px] mx-auto space-y-3 relative z-10">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-2 border-b border-zinc-200 pb-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="p-1.5 bg-white rounded-sm border border-zinc-200 shadow-sm">
                <Truck className="text-blue-600" size={18} />
              </div>
              <div>
                <h1 className="text-2xl font-black text-zinc-900 tracking-tighter uppercase leading-none">
                  Gate<span className="text-blue-600">MS</span>
                </h1>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-[7px] font-bold text-zinc-400 uppercase tracking-[0.3em]">Vehicle Tracking System</span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex flex-wrap items-center gap-2 sm:gap-4">
            <Link 
              href="/history"
              className="flex items-center gap-2 px-4 py-2 bg-white border border-zinc-200 rounded-sm hover:bg-zinc-50 transition-colors shadow-sm group"
            >
              <HistoryIcon size={14} className="text-zinc-400 group-hover:text-blue-600 transition-colors" />
              <span className="text-[9px] font-black text-zinc-600 uppercase tracking-widest">Vehicle History</span>
            </Link>

            <button
              type="button"
              onClick={() => void loadVehicles(true)}
              disabled={refreshing}
              aria-busy={refreshing}
              aria-label="Refresh vehicle list"
              className="flex items-center gap-2 px-4 py-2 bg-white border border-zinc-200 rounded-sm hover:bg-zinc-50 transition-colors shadow-sm disabled:opacity-60 disabled:pointer-events-none group"
            >
              <RefreshCw
                size={14}
                className={`text-zinc-400 group-hover:text-blue-600 transition-colors ${refreshing ? 'animate-spin' : ''}`}
              />
              <span className="text-[9px] font-black text-zinc-600 uppercase tracking-widest group-hover:text-zinc-900">
                Refresh
              </span>
            </button>
            
            <button 
              onClick={logout}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-zinc-200 rounded-sm hover:bg-red-50 hover:border-red-200 transition-colors shadow-sm group"
            >
              <LogOut size={14} className="text-zinc-400 group-hover:text-red-600 transition-colors" />
              <span className="text-[9px] font-black text-zinc-600 uppercase tracking-widest group-hover:text-red-600">Logout</span>
            </button>
            <div className="flex flex-col items-end">
              <span className="text-[7px] font-black text-zinc-400 uppercase tracking-widest mb-0.5">System Status</span>
              <div className="flex items-center gap-1.5 px-2 py-0.5 bg-green-500/5 border border-green-500/10 rounded-sm">
                <span className="w-1 h-1 bg-green-500 rounded-full shadow-[0_0_8px_rgba(34,197,94,0.4)] animate-pulse" />
                <span className="text-[7px] font-black text-green-600 uppercase tracking-widest">Active</span>
              </div>
            </div>
          </div>
        </div>

        {/* Main Dashboard Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-start">
          
          {/* Left Section: Parking & Exit (2/3 width) */}
          <div className="lg:col-span-2 space-y-3">
            {/* Top Row: Inward & Outward */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {/* Column 1: Inward Parking Yard */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-1 h-4 bg-blue-600 rounded-full" />
                  <h2 className="text-[10px] font-black text-zinc-900 uppercase tracking-[0.4em]">Inward Parking</h2>
                </div>
                <div className="relative bg-white rounded-lg p-3 border border-zinc-200 shadow-xl overflow-hidden min-h-[400px]">
                  <div className="absolute inset-0 opacity-[0.05] pointer-events-none bg-[radial-gradient(#000000_1px,transparent_1px)] [background-size:24px_24px]" />
                  
                  <div className="flex flex-col gap-3 relative z-10">
                    {inwardParkedVehicles.map((vehicle, index) => (
                      <div key={`inward-${index}`} className="relative">
                        <div className="absolute -inset-x-2 -inset-y-2 border-y border-zinc-100 pointer-events-none">
                          <div className="absolute top-0 left-0 bottom-0 w-px bg-gradient-to-b from-transparent via-zinc-200 to-transparent" />
                          <div className="absolute top-0 right-0 bottom-0 w-px bg-gradient-to-b from-transparent via-zinc-200 to-transparent" />
                        </div>
                        <div className="absolute -top-3 -left-1 text-[32px] font-black text-zinc-900/[0.03] select-none italic">
                          {String(index + 1).padStart(2, '0')}
                        </div>
                        <div className="relative z-20 pt-0.5">
                          <VehicleCard 
                            vehicle={{
                              ...vehicle,
                              rawCheckInDate: vehicle.rawCheckInDate,
                              rawCheckOutDate: vehicle.rawCheckOutDate,
                              rawDockInDate: vehicle.rawDockInDate,
                              rawDockOutDate: vehicle.rawDockOutDate
                            }} 
                            onClick={() => setSelectedVehicle(vehicle)}
                          />
                        </div>
                      </div>
                    ))}

                    {/* Empty Bays for Inward */}
                    {[...Array(Math.max(0, 5 - inwardParkedVehicles.length))].map((_, i) => (
                      <div key={`empty-inward-${i}`} className="relative group">
                        <div className="absolute -inset-x-2 -inset-y-2 border-y border-zinc-100 pointer-events-none" />
                        <div className="absolute -top-3 -left-1 text-[32px] font-black text-zinc-900/[0.03] select-none italic">
                          {String(inwardParkedVehicles.length + i + 1).padStart(2, '0')}
                        </div>
                        <div className="h-[84px] flex items-center justify-center border border-dashed border-zinc-200 rounded-xl group-hover:border-blue-500/20 transition-colors">
                          <div className="flex flex-col items-center gap-1">
                            <div className="w-6 h-0.5 bg-zinc-200 rounded-full" />
                            <span className="text-zinc-300 font-black uppercase tracking-[0.2em] text-[7px]">Inward Standby</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Column 2: Outward Parking Yard */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-1 h-4 bg-orange-600 rounded-full" />
                  <h2 className="text-[10px] font-black text-zinc-900 uppercase tracking-[0.4em]">Outward Parking</h2>
                </div>
                <div className="relative bg-white rounded-lg p-3 border border-zinc-200 shadow-xl overflow-hidden min-h-[400px]">
                  <div className="absolute inset-0 opacity-[0.05] pointer-events-none bg-[radial-gradient(#000000_1px,transparent_1px)] [background-size:24px_24px]" />
                  
                  <div className="flex flex-col gap-3 relative z-10">
                    {outwardParkedVehicles.map((vehicle, index) => (
                      <div key={`outward-${index}`} className="relative">
                        <div className="absolute -inset-x-2 -inset-y-2 border-y border-zinc-100 pointer-events-none">
                          <div className="absolute top-0 left-0 bottom-0 w-px bg-gradient-to-b from-transparent via-zinc-200 to-transparent" />
                          <div className="absolute top-0 right-0 bottom-0 w-px bg-gradient-to-b from-transparent via-zinc-200 to-transparent" />
                        </div>
                        <div className="absolute -top-3 -left-1 text-[32px] font-black text-zinc-900/[0.03] select-none italic">
                          {String(index + 1).padStart(2, '0')}
                        </div>
                        <div className="relative z-20 pt-0.5">
                          <VehicleCard 
                            vehicle={{
                              ...vehicle,
                              rawCheckInDate: vehicle.rawCheckInDate,
                              rawCheckOutDate: vehicle.rawCheckOutDate,
                              rawDockInDate: vehicle.rawDockInDate,
                              rawDockOutDate: vehicle.rawDockOutDate
                            }} 
                            onClick={() => setSelectedVehicle(vehicle)}
                          />
                        </div>
                      </div>
                    ))}

                    {/* Empty Bays for Outward */}
                    {[...Array(Math.max(0, 5 - outwardParkedVehicles.length))].map((_, i) => (
                      <div key={`empty-outward-${i}`} className="relative group">
                        <div className="absolute -inset-x-2 -inset-y-2 border-y border-zinc-100 pointer-events-none" />
                        <div className="absolute -top-3 -left-1 text-[32px] font-black text-zinc-900/[0.03] select-none italic">
                          {String(outwardParkedVehicles.length + i + 1).padStart(2, '0')}
                        </div>
                        <div className="h-[84px] flex items-center justify-center border border-dashed border-zinc-200 rounded-xl group-hover:border-orange-500/20 transition-colors">
                          <div className="flex flex-col items-center gap-1">
                            <div className="w-6 h-0.5 bg-zinc-200 rounded-full" />
                            <span className="text-zinc-300 font-black uppercase tracking-[0.2em] text-[7px]">Outward Standby</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Row: Exit Bay */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-1 h-4 bg-green-600 rounded-full" />
                <h2 className="text-[10px] font-black text-zinc-900 uppercase tracking-[0.4em]">Exit Bay</h2>
              </div>
              <div className="relative bg-white rounded-lg p-3 border border-zinc-200 shadow-xl overflow-hidden min-h-[200px]">
                <div className="absolute inset-0 opacity-[0.05] pointer-events-none bg-[radial-gradient(#000000_1px,transparent_1px)] [background-size:24px_24px]" />
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 relative z-10">
                  {exitVehicles.map((vehicle, index) => (
                    <div key={`exit-${index}`} className="relative">
                      <div className="absolute -inset-x-2 -inset-y-2 border-y border-zinc-100 pointer-events-none">
                        <div className="absolute top-0 left-0 bottom-0 w-px bg-gradient-to-b from-transparent via-zinc-200 to-transparent" />
                        <div className="absolute top-0 right-0 bottom-0 w-px bg-gradient-to-b from-transparent via-zinc-200 to-transparent" />
                      </div>
                      <div className="absolute -top-3 -left-1 text-[32px] font-black text-zinc-900/[0.03] select-none italic">
                        {String(index + 1).padStart(2, '0')}
                      </div>
                      <div className="relative z-20 pt-0.5">
                        <VehicleCard 
                          vehicle={{
                            ...vehicle,
                            rawCheckInDate: vehicle.rawCheckInDate,
                            rawCheckOutDate: vehicle.rawCheckOutDate,
                            rawDockInDate: vehicle.rawDockInDate,
                            rawDockOutDate: vehicle.rawDockOutDate
                          }} 
                          onClick={() => setSelectedVehicle(vehicle)}
                        />
                      </div>
                    </div>
                  ))}

                  {/* Empty Bays for Exit */}
                  {[...Array(Math.max(0, 4 - exitVehicles.length))].map((_, i) => (
                    <div key={`empty-exit-${i}`} className="relative group">
                      <div className="absolute -inset-x-2 -inset-y-2 border-y border-zinc-100 pointer-events-none" />
                      <div className="absolute -top-3 -left-1 text-[32px] font-black text-zinc-900/[0.03] select-none italic">
                        {String(exitVehicles.length + i + 1).padStart(2, '0')}
                      </div>
                      <div className="h-[84px] flex items-center justify-center border border-dashed border-zinc-200 rounded-xl group-hover:border-green-500/20 transition-colors">
                        <div className="flex flex-col items-center gap-1">
                          <div className="w-6 h-0.5 bg-zinc-200 rounded-full" />
                          <span className="text-zinc-300 font-black uppercase tracking-[0.2em] text-[7px]">Exit Standby</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Vertical Loading Docks (1/3 width) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-1 h-4 bg-blue-600 rounded-full" />
                <h2 className="text-[10px] font-black text-zinc-900 uppercase tracking-[0.4em]">Loading Docks</h2>
              </div>
            </div>

            <div className="relative bg-zinc-200/30 rounded-lg border border-zinc-300 shadow-2xl overflow-hidden min-h-[800px] flex flex-row">
              {/* Parking Area (Floor) - Left Side */}
              <div className="flex-grow relative bg-zinc-200/50 p-3 flex flex-col justify-between">
                {/* Horizontal Ground Markings */}
                <div className="absolute inset-0 pointer-events-none opacity-10">
                  <div className="absolute inset-0" style={{ 
                    backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 90px, #000 90px, #000 91px)',
                    backgroundSize: '100% 100%'
                  }} />
                </div>

                {docks.map((dock, index) => (
                  <motion.div 
                    key={`dock-bay-${dock.id}`} 
                    initial={{ x: -50, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ duration: 0.6, delay: index * 0.05 }}
                    className="h-20 flex items-center justify-end relative pr-2"
                  >
                    {/* Bay Number on Floor */}
                    <div className="absolute left-2 text-[48px] font-black text-zinc-900/[0.04] select-none italic leading-none">
                      {String(dock.id).padStart(2, '0')}
                    </div>

                    <div className="relative z-40">
                      {dock.status === 'occupied' && dock.vehicle ? (
                        <motion.div 
                          initial={{ scale: 0.9 }}
                          animate={{ scale: 1 }}
                          className="z-50"
                        >
                          <VehicleCard 
                            vehicle={{
                              ...dock.vehicle,
                              rawCheckInDate: dock.vehicle.rawCheckInDate,
                              rawCheckOutDate: dock.vehicle.rawCheckOutDate,
                              rawDockInDate: dock.vehicle.rawDockInDate,
                              rawDockOutDate: dock.vehicle.rawDockOutDate
                            }} 
                            isDocked 
                            onClick={() => setSelectedVehicle(dock.vehicle)}
                          />
                        </motion.div>
                      ) : (
                        <div className={`w-40 h-[70px] flex items-center justify-center border-2 border-dashed rounded-xl transition-colors z-40
                          ${dock.status === 'maintenance' ? 'bg-red-50/50 border-red-200' : 'border-zinc-300/50 group-hover:border-blue-500/20'}`}>
                          <div className="flex flex-col items-center gap-1">
                            <span className={`font-black uppercase tracking-[0.2em] text-[7px] ${dock.status === 'maintenance' ? 'text-red-400' : 'text-zinc-400'}`}>
                              {dock.status === 'maintenance' ? 'Out of Service' : 'Ready'}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Warehouse Wall Visual (Right Side) */}
              <div className="w-24 bg-zinc-100 border-l-4 border-zinc-300 relative z-20 flex flex-col justify-between py-0">
                {docks.map((dock) => (
                  <div key={`door-${dock.id}`} className="flex flex-row items-center gap-1.5 h-20 px-1.5 border-b border-zinc-200 last:border-0">
                    <div className="flex flex-col items-center justify-center min-w-[35px]">
                      <span className="text-[8px] font-black text-zinc-400 uppercase tracking-tighter leading-none">DOCK</span>
                      <span className="text-sm font-black text-blue-600 leading-none">{String(dock.id).padStart(2, '0')}</span>
                    </div>
                    
                    <div className={`flex-grow h-14 rounded-l-md border-y-2 border-l-2 relative overflow-hidden transition-colors
                      ${dock.status === 'occupied' ? 'bg-zinc-800 border-zinc-700' : 
                        dock.status === 'maintenance' ? 'bg-zinc-900 border-red-900/40' : 
                        'bg-zinc-300 border-zinc-400'}`}>
                      {/* Door Slats */}
                      <div className="absolute inset-0 flex flex-row gap-[2px] p-[2px]">
                        {[...Array(6)].map((_, i) => (
                          <div key={i} className={`w-full h-full opacity-20 ${dock.status === 'occupied' ? 'bg-zinc-600' : 'bg-zinc-500'}`} />
                        ))}
                      </div>
                      {/* Status Light */}
                      <div className="absolute top-1 right-1">
                        <div className={`w-1.5 h-1.5 rounded-full 
                          ${dock.status === 'occupied' ? 'bg-blue-500 shadow-blue-500/50' : 
                            dock.status === 'maintenance' ? 'bg-red-500 animate-pulse shadow-red-500/50' : 
                            'bg-green-500 shadow-green-500/50'}`} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <AnimatePresence mode="wait">
          {selectedVehicle && (
            <VehicleDetailModal
              key={selectedVehicle.id}
              vehicle={selectedVehicle}
              onClose={() => setSelectedVehicle(null)}
            />
          )}
        </AnimatePresence>

      </div>
    </main>
  );
}
