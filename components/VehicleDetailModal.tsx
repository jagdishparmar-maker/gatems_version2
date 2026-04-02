'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import {
  X,
  User,
  Phone,
  Building2,
  Zap,
  Clock,
  ClipboardList,
  UserCheck,
  History as HistoryIcon,
  Hash,
  Maximize2,
  Truck,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import type { Vehicle } from '@/types/vehicle';
import { calculateDuration } from '@/lib/vehicle-utils';

type VehicleDetailModalProps = {
  vehicle: Vehicle;
  onClose: () => void;
};

export default function VehicleDetailModal({
  vehicle,
  onClose,
}: VehicleDetailModalProps) {
  const [isFullScreenImage, setIsFullScreenImage] = useState(false);

  useEffect(() => {
    setIsFullScreenImage(false);
  }, [vehicle.id]);

  return (
    <>
      <motion.div
        className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-zinc-900/60 backdrop-blur-sm"
        />
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="relative w-full max-w-4xl bg-white rounded-xl shadow-2xl overflow-hidden flex flex-col md:flex-row max-h-[85vh] h-full"
        >
            <button
              onClick={onClose}
              className="absolute top-6 right-6 z-50 p-2 bg-white/80 backdrop-blur-md rounded-sm border border-zinc-200 text-zinc-500 hover:text-zinc-900 transition-colors"
              type="button"
              aria-label="Close details"
            >
              <X size={20} />
            </button>

            <div
              className="w-full md:w-5/12 bg-zinc-100 relative overflow-hidden group min-h-[300px] md:min-h-full flex-shrink-0 cursor-pointer"
              onClick={() => vehicle.imageUrl && setIsFullScreenImage(true)}
              role="presentation"
            >
              {vehicle.imageUrl ? (
                <div className="absolute inset-0">
                  <Image
                    src={vehicle.imageUrl}
                    alt={vehicle.vehicleNo}
                    fill
                    sizes="(max-width: 768px) 100vw, 42vw"
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                    referrerPolicy="no-referrer"
                    priority
                  />
                </div>
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-zinc-300">
                  <Truck size={80} strokeWidth={1} />
                  <span className="text-[10px] font-black uppercase tracking-widest mt-4">
                    No Visual Data
                  </span>
                </div>
              )}

              {vehicle.imageUrl && (
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                  <div className="bg-white/20 backdrop-blur-md px-4 py-2 rounded-sm border border-white/30 text-white text-[10px] font-black uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-all transform translate-y-2 group-hover:translate-y-0 flex items-center gap-2">
                    <Maximize2 size={14} />
                    View Full Screen
                  </div>
                </div>
              )}

              <div className="absolute inset-0 bg-gradient-to-t from-zinc-900/40 to-transparent pointer-events-none" />
              <div className="absolute bottom-8 left-8 pointer-events-none">
                <div className="flex items-center gap-3 mb-2">
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-2 h-2 rounded-full ${vehicle.status === 'ready_to_exit' ? 'bg-green-500' : 'bg-blue-500'} animate-pulse`}
                    />
                    <span className="text-[10px] font-black text-white uppercase tracking-widest">
                      {vehicle.status}
                    </span>
                  </div>
                  <div className="w-px h-3 bg-white/20" />
                  <span className="text-[10px] font-bold text-white/60 uppercase tracking-widest">
                    {vehicle.rawStatus}
                  </span>
                </div>
                <h3 className="text-4xl font-black text-white tracking-tighter uppercase leading-none">
                  {vehicle.vehicleNo}
                </h3>
              </div>
            </div>

            <div className="w-full md:w-7/12 flex flex-col min-h-0 flex-1 bg-white">
              <div className="flex border-b border-zinc-100 px-8 pt-6 flex-shrink-0">
                <div className="pb-4 px-4 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-900 relative">
                  Vehicle Details
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-zinc-900 rounded-t-full" />
                </div>
              </div>

              <div className="flex-grow overflow-y-auto p-8">
                <div className="space-y-8">
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-1">
                      <span className="text-[8px] font-black text-zinc-400 uppercase tracking-widest flex items-center gap-1">
                        <Building2 size={10} /> Transport
                      </span>
                      <p className="text-sm font-bold text-zinc-900 uppercase">
                        {vehicle.transport}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <span className="text-[8px] font-black text-zinc-400 uppercase tracking-widest flex items-center gap-1">
                        <User size={10} /> Customer
                      </span>
                      <p className="text-sm font-bold text-zinc-900 uppercase">
                        {vehicle.customer}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <span className="text-[8px] font-black text-zinc-400 uppercase tracking-widest flex items-center gap-1">
                        <Zap size={10} /> Type
                      </span>
                      <p className="text-sm font-bold text-zinc-900 uppercase">
                        {vehicle.type}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <span className="text-[8px] font-black text-zinc-400 uppercase tracking-widest flex items-center gap-1">
                        <Hash size={10} /> Assigned Dock
                      </span>
                      <p className="text-sm font-bold text-zinc-900 uppercase">
                        {vehicle.assignedDock > 0
                          ? `Dock ${String(vehicle.assignedDock).padStart(2, '0')}`
                          : 'Not Assigned'}
                      </p>
                    </div>
                  </div>

                  <div className="h-px bg-zinc-100" />

                  <div className="space-y-4">
                    <h4 className="text-[10px] font-black text-zinc-900 uppercase tracking-[0.3em]">
                      Driver Information
                    </h4>
                    <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-1">
                        <span className="text-[8px] font-black text-zinc-400 uppercase tracking-widest flex items-center gap-1">
                          <User size={10} /> Name
                        </span>
                        <p className="text-sm font-bold text-zinc-900">
                          {vehicle.driverName}
                        </p>
                      </div>
                      <div className="space-y-1">
                        <span className="text-[8px] font-black text-zinc-400 uppercase tracking-widest flex items-center gap-1">
                          <Phone size={10} /> Contact
                        </span>
                        <p className="text-sm font-bold text-zinc-900">
                          {vehicle.driverPhone}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="h-px bg-zinc-100" />

                  <div className="space-y-4">
                    <h4 className="text-[10px] font-black text-zinc-900 uppercase tracking-[0.3em]">
                      Operational Timeline
                    </h4>
                    <div className="grid grid-cols-2 gap-y-4 gap-x-6">
                      <div className="space-y-1">
                        <span className="text-[8px] font-black text-zinc-400 uppercase tracking-widest flex items-center gap-1">
                          <Clock size={10} /> Check In
                        </span>
                        <p className="text-[11px] font-bold text-zinc-900 font-mono">
                          {vehicle.checkedInTime}
                        </p>
                      </div>
                      <div className="space-y-1">
                        <span className="text-[8px] font-black text-blue-600 uppercase tracking-widest flex items-center gap-1">
                          <HistoryIcon size={10} /> Yard Duration
                        </span>
                        <p className="text-[11px] font-bold text-blue-600 font-mono">
                          {calculateDuration(
                            vehicle.rawCheckInDate,
                            vehicle.rawCheckOutDate
                          )}
                        </p>
                      </div>
                      <div className="space-y-1">
                        <span className="text-[8px] font-black text-zinc-400 uppercase tracking-widest flex items-center gap-1">
                          <Clock size={10} /> Dock In
                        </span>
                        <p className="text-[11px] font-bold text-zinc-900 font-mono">
                          {vehicle.dockInDateTime}
                        </p>
                      </div>
                      <div className="space-y-1">
                        <span className="text-[8px] font-black text-orange-600 uppercase tracking-widest flex items-center gap-1">
                          <HistoryIcon size={10} /> Dock Duration
                        </span>
                        <p className="text-[11px] font-bold text-orange-600 font-mono">
                          {vehicle.rawDockInDate
                            ? calculateDuration(
                                vehicle.rawDockInDate,
                                vehicle.rawDockOutDate
                              )
                            : 'N/A'}
                        </p>
                      </div>
                      <div className="space-y-1">
                        <span className="text-[8px] font-black text-zinc-400 uppercase tracking-widest flex items-center gap-1">
                          <Clock size={10} /> Dock Out
                        </span>
                        <p className="text-[11px] font-bold text-zinc-900 font-mono">
                          {vehicle.dockOutDateTime}
                        </p>
                      </div>
                      <div className="space-y-1">
                        <span className="text-[8px] font-black text-zinc-400 uppercase tracking-widest flex items-center gap-1">
                          <Clock size={10} /> Check Out
                        </span>
                        <p className="text-[11px] font-bold text-zinc-900 font-mono">
                          {vehicle.checkOutDate}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="h-px bg-zinc-100" />

                  <div className="space-y-2">
                    <span className="text-[8px] font-black text-zinc-400 uppercase tracking-widest flex items-center gap-1">
                      <ClipboardList size={10} /> Remarks
                    </span>
                    <div className="p-3 bg-zinc-50 rounded-sm border border-zinc-100">
                      <p className="text-xs text-zinc-600 leading-relaxed italic">
                        {vehicle.remarks || 'No remarks provided for this vehicle.'}
                      </p>
                    </div>
                  </div>

                  <div className="h-px bg-zinc-100" />

                  <div className="space-y-4">
                    <h4 className="text-[10px] font-black text-zinc-900 uppercase tracking-[0.3em]">
                      System Metadata
                    </h4>
                    <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-1">
                        <span className="text-[8px] font-black text-zinc-400 uppercase tracking-widest flex items-center gap-1">
                          <UserCheck size={10} /> Checked In By
                        </span>
                        <p className="text-[10px] font-bold text-zinc-500 truncate">
                          {vehicle.checkedInBy}
                        </p>
                      </div>
                      <div className="space-y-1">
                        <span className="text-[8px] font-black text-zinc-400 uppercase tracking-widest flex items-center gap-1">
                          <UserCheck size={10} /> Checked Out By
                        </span>
                        <p className="text-[10px] font-bold text-zinc-500 truncate">
                          {vehicle.checkedOutBy}
                        </p>
                      </div>
                      <div className="space-y-1">
                        <span className="text-[8px] font-black text-zinc-400 uppercase tracking-widest flex items-center gap-1">
                          <HistoryIcon size={10} /> Record Created
                        </span>
                        <p className="text-[10px] font-bold text-zinc-500">
                          {vehicle.created}
                        </p>
                      </div>
                      <div className="space-y-1">
                        <span className="text-[8px] font-black text-zinc-400 uppercase tracking-widest flex items-center gap-1">
                          <HistoryIcon size={10} /> Last Updated
                        </span>
                        <p className="text-[10px] font-bold text-zinc-500">
                          {vehicle.updated}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-8 border-t border-zinc-100 flex-shrink-0">
                <button
                  onClick={onClose}
                  type="button"
                  className="w-full py-4 bg-zinc-900 text-white rounded-sm font-black uppercase tracking-widest text-[10px] hover:bg-zinc-800 transition-colors"
                >
                  Close Details
                </button>
              </div>
            </div>
        </motion.div>
      </motion.div>

      <AnimatePresence>
        {isFullScreenImage && vehicle.imageUrl && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 md:p-8">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsFullScreenImage(false)}
              className="absolute inset-0 bg-zinc-950/95 backdrop-blur-xl"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="relative w-full h-full max-w-6xl flex items-center justify-center"
            >
              <button
                onClick={() => setIsFullScreenImage(false)}
                type="button"
                className="absolute -top-12 right-0 md:top-0 md:-right-12 p-3 text-white/60 hover:text-white transition-colors"
                aria-label="Close full screen image"
              >
                <X size={32} />
              </button>

              <div className="relative w-full h-full rounded-lg overflow-hidden shadow-2xl border border-white/10">
                <Image
                  src={vehicle.imageUrl}
                  alt={vehicle.vehicleNo}
                  fill
                  sizes="(max-width: 1280px) 100vw, 1152px"
                  className="object-contain"
                  referrerPolicy="no-referrer"
                  priority
                />
              </div>

              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/40 backdrop-blur-md px-6 py-3 rounded-sm border border-white/10 text-white">
                <p className="text-xs font-black uppercase tracking-[0.3em]">
                  {vehicle.vehicleNo}
                </p>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
