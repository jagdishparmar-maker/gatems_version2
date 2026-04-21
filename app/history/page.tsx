'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { Truck, Loader2, ChevronLeft, Search, LogOut } from 'lucide-react';
import { AnimatePresence } from 'motion/react';
import { pb } from '@/lib/pocketbase';
import { mapVehicleRecord } from '@/lib/vehicle-mapper';
import { VEHICLE_USER_EXPAND } from '@/lib/user-display';
import { useAuth } from '@/components/AuthProvider';
import VehicleCard from '@/components/VehicleCard';
import VehicleDetailModal from '@/components/VehicleDetailModal';
import type { Vehicle } from '@/types/vehicle';

type FilterType = '7days' | '30days' | 'custom';

export default function HistoryPage() {
  const { logout } = useAuth();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [filterType, setFilterType] = useState<FilterType>('7days');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const fetchHistory = useCallback(async () => {
    try {
      setLoading(true);
      let filter = "";
      
      const now = new Date();
      if (filterType === '7days') {
        const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        filter = `Check_In_Date >= "${sevenDaysAgo.toISOString().replace('T', ' ').split('.')[0]}"`;
      } else if (filterType === '30days') {
        const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        filter = `Check_In_Date >= "${thirtyDaysAgo.toISOString().replace('T', ' ').split('.')[0]}"`;
      } else if (filterType === 'custom' && startDate && endDate) {
        filter = `Check_In_Date >= "${startDate} 00:00:00" && Check_In_Date <= "${endDate} 23:59:59"`;
      }

      const records = await pb.collection('vehicles').getFullList({
        filter: filter,
        sort: '-Check_In_Date',
        requestKey: null,
        expand: VEHICLE_USER_EXPAND,
      });

      setVehicles(
        records.map((item) => mapVehicleRecord(item, { includeCheckedOut: true }))
      );
      setError(null);
    } catch (err: unknown) {
      const e = err as { isAbort?: boolean };
      if (e.isAbort) return;
      
      console.error('Error fetching history:', err);
      setError('Failed to load vehicle history.');
    } finally {
      setLoading(false);
    }
  }, [filterType, startDate, endDate]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const filteredVehicles = useMemo(() => {
    if (!searchQuery) return vehicles;
    const query = searchQuery.toLowerCase();
    return vehicles.filter(v => 
      v.vehicleNo.toLowerCase().includes(query) ||
      v.transport.toLowerCase().includes(query) ||
      v.customer.toLowerCase().includes(query) ||
      v.driverName?.toLowerCase().includes(query)
    );
  }, [vehicles, searchQuery]);

  const inwardVehicles = filteredVehicles.filter(v => v.type === 'Inward');
  const outwardVehicles = filteredVehicles.filter(v => v.type === 'Outward');

  return (
    <main className="min-h-screen bg-zinc-50 py-4 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-[1600px] mx-auto space-y-4">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-200 pb-4">
          <div className="flex items-center gap-4">
            <Link 
              href="/"
              className="p-2 bg-white rounded-sm border border-zinc-200 shadow-sm hover:bg-zinc-50 transition-colors text-zinc-600"
            >
              <ChevronLeft size={20} />
            </Link>
            <div>
              <h1 className="text-2xl font-black text-zinc-900 tracking-tighter uppercase leading-none">
                Gate<span className="text-blue-600">MS</span> History
              </h1>
              <div className="flex items-center gap-2 mt-1">
                <p className="text-[7px] font-bold text-zinc-400 uppercase tracking-[0.3em]">Historical Logistics Data</p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button 
              onClick={logout}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-zinc-200 rounded-sm hover:bg-red-50 hover:border-red-200 transition-colors shadow-sm group"
            >
              <LogOut size={14} className="text-zinc-400 group-hover:text-red-600 transition-colors" />
              <span className="text-[9px] font-black text-zinc-600 uppercase tracking-widest group-hover:text-red-600">Logout</span>
            </button>

            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={14} />
              <input 
                type="text"
                placeholder="SEARCH VEHICLE, TRANSPORT..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-4 py-2 bg-white border border-zinc-200 rounded-sm text-[10px] font-bold uppercase tracking-widest focus:outline-none focus:border-blue-500 w-64"
              />
            </div>

            {/* Filters */}
            <div className="flex items-center bg-white border border-zinc-200 rounded-sm p-1">
              <button 
                onClick={() => setFilterType('7days')}
                className={`px-3 py-1.5 text-[9px] font-black uppercase tracking-widest rounded-sm transition-colors ${filterType === '7days' ? 'bg-zinc-900 text-white' : 'text-zinc-500 hover:bg-zinc-50'}`}
              >
                7 Days
              </button>
              <button 
                onClick={() => setFilterType('30days')}
                className={`px-3 py-1.5 text-[9px] font-black uppercase tracking-widest rounded-sm transition-colors ${filterType === '30days' ? 'bg-zinc-900 text-white' : 'text-zinc-500 hover:bg-zinc-50'}`}
              >
                30 Days
              </button>
              <button 
                onClick={() => setFilterType('custom')}
                className={`px-3 py-1.5 text-[9px] font-black uppercase tracking-widest rounded-sm transition-colors ${filterType === 'custom' ? 'bg-zinc-900 text-white' : 'text-zinc-500 hover:bg-zinc-50'}`}
              >
                Custom
              </button>
            </div>

            {filterType === 'custom' && (
              <div className="flex items-center gap-2 animate-in fade-in slide-in-from-right-2">
                <input 
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="px-3 py-2 bg-white border border-zinc-200 rounded-sm text-[9px] font-bold uppercase"
                />
                <span className="text-zinc-400 text-[10px] font-black">TO</span>
                <input 
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="px-3 py-2 bg-white border border-zinc-200 rounded-sm text-[9px] font-bold uppercase"
                />
              </div>
            )}
          </div>
        </div>

        {loading ? (
          <div className="h-[60vh] flex flex-col items-center justify-center gap-4">
            <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
            <p className="text-zinc-400 font-black uppercase tracking-widest text-[10px]">Retrieving Historical Records...</p>
          </div>
        ) : error ? (
          <div className="h-[60vh] flex flex-col items-center justify-center gap-4">
            <div className="p-4 bg-red-50 border border-red-100 rounded-sm text-red-600 text-[10px] font-black uppercase tracking-widest">
              {error}
            </div>
            <button onClick={fetchHistory} className="text-blue-600 text-[10px] font-black uppercase tracking-widest hover:underline">Try Again</button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Inward History */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-1 h-4 bg-blue-600 rounded-full" />
                  <h2 className="text-[10px] font-black text-zinc-900 uppercase tracking-[0.4em]">Inward Records ({inwardVehicles.length})</h2>
                </div>
              </div>
              <div className="space-y-3">
                {inwardVehicles.length > 0 ? (
                  inwardVehicles.map((vehicle) => (
                    <VehicleCard 
                      key={vehicle.id}
                      vehicle={vehicle}
                      onClick={() => setSelectedVehicle(vehicle)}
                    />
                  ))
                ) : (
                  <div className="p-12 border border-dashed border-zinc-200 rounded-lg flex flex-col items-center justify-center text-zinc-300">
                    <Truck size={40} strokeWidth={1} />
                    <p className="text-[8px] font-black uppercase tracking-widest mt-4">No Inward Records Found</p>
                  </div>
                )}
              </div>
            </div>

            {/* Outward History */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-1 h-4 bg-orange-600 rounded-full" />
                  <h2 className="text-[10px] font-black text-zinc-900 uppercase tracking-[0.4em]">Outward Records ({outwardVehicles.length})</h2>
                </div>
              </div>
              <div className="space-y-3">
                {outwardVehicles.length > 0 ? (
                  outwardVehicles.map((vehicle) => (
                    <VehicleCard 
                      key={vehicle.id}
                      vehicle={vehicle}
                      onClick={() => setSelectedVehicle(vehicle)}
                    />
                  ))
                ) : (
                  <div className="p-12 border border-dashed border-zinc-200 rounded-lg flex flex-col items-center justify-center text-zinc-300">
                    <Truck size={40} strokeWidth={1} />
                    <p className="text-[8px] font-black uppercase tracking-widest mt-4">No Outward Records Found</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

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
