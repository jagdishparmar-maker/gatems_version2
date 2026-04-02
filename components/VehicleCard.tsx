'use client';

import React from 'react';
import { Truck, Clock, Building2, User, Hash, Zap, Phone, MapPin, Weight, Box, AlertTriangle } from 'lucide-react';
import { motion } from 'motion/react';

interface VehicleDetails {
  vehicleNo: string;
  transport: string;
  customer: string;
  checkedInTime: string;
  size?: 'short' | 'medium' | 'long';
  isCharging?: boolean;
  chargeLevel?: number;
  status?: 'parked' | 'charging' | 'loading' | 'unloading' | 'ready_to_exit';
  progress?: number;
  rawCheckInDate?: string;
  rawCheckOutDate?: string;
  rawDockInDate?: string;
  rawDockOutDate?: string;
}

interface VehicleCardProps {
  vehicle: VehicleDetails;
  isDocked?: boolean;
  onClick?: () => void;
}

export default function VehicleCard({ vehicle, isDocked = false, onClick }: VehicleCardProps) {
  // Extract just the time part for a shorter arrival display
  const shortTime = vehicle.checkedInTime.split(',')[1]?.trim() || vehicle.checkedInTime;

  const calculateDuration = (startDateStr: string | undefined, endDateStr: string | undefined) => {
    if (!startDateStr) return "";
    
    const start = new Date(startDateStr);
    const end = endDateStr ? new Date(endDateStr) : new Date();
    
    if (isNaN(start.getTime())) return "";
    
    const diffMs = end.getTime() - start.getTime();
    if (diffMs < 0) return "0m";
    
    const diffMins = Math.floor(diffMs / 60000);
    const days = Math.floor(diffMins / 1440);
    const hours = Math.floor((diffMins % 1440) / 60);
    const mins = diffMins % 60;
    
    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h ${mins}m`;
    return `${mins}m`;
  };

  const yardDuration = calculateDuration(vehicle.rawCheckInDate, vehicle.rawCheckOutDate);
  const dockDuration = calculateDuration(vehicle.rawDockInDate, vehicle.rawDockOutDate);

  // Check if yard duration is more than 1 day (24 hours)
  const isLongStay = React.useMemo(() => {
    if (!vehicle.rawCheckInDate) return false;
    const start = new Date(vehicle.rawCheckInDate);
    const end = vehicle.rawCheckOutDate ? new Date(vehicle.rawCheckOutDate) : new Date();
    if (isNaN(start.getTime())) return false;
    return (end.getTime() - start.getTime()) > 86400000; // 24 hours in ms
  }, [vehicle.rawCheckInDate, vehicle.rawCheckOutDate]);

  // Size mapping for the truck length
  const sizeClasses = {
    short: 'max-w-[240px]',
    medium: 'max-w-[320px]',
    long: 'max-w-[400px]'
  };

  const currentSizeClass = sizeClasses[vehicle.size || 'medium'];

  // Status-based colors and icons
  const isCharging = vehicle.status === 'charging' || vehicle.isCharging;
  const isLoading = vehicle.status === 'loading';
  const isUnloading = vehicle.status === 'unloading';
  const isReadyToExit = vehicle.status === 'ready_to_exit';
  const isActive = isCharging || isLoading || isUnloading || isReadyToExit;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02, y: -4 }}
      onClick={onClick}
      className={`relative flex items-end group h-[84px] font-sans transition-all cursor-pointer
        ${isDocked ? 'w-[260px]' : `w-full ${currentSizeClass}`}`}
      role="article"
      aria-label={`Truck ${vehicle.vehicleNo} unit ${vehicle.status || ''}`}
    >
      {/* Charging Cable Visual */}
      {isCharging && (
        <div className="absolute -left-6 bottom-4 w-6 h-8 pointer-events-none z-10">
          <svg width="24" height="32" viewBox="0 0 24 32" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M0 16C8 16 12 24 20 24" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" className="animate-pulse" />
            <rect x="18" y="20" width="6" height="8" rx="1" fill="#1f2937" />
            <rect x="20" y="22" width="2" height="4" rx="0.5" fill="#3b82f6" className="animate-pulse" />
          </svg>
        </div>
      )}

      {/* Truck Cabin - Light Theme */}
      <div className={`relative w-14 h-14 rounded-t-xl rounded-l-xl border-t border-l flex-shrink-0 flex flex-col shadow-lg z-30 transition-colors 
        ${isCharging ? 'bg-blue-50 border-blue-200' : 
          isLoading ? 'bg-orange-50 border-orange-200' : 
          isUnloading ? 'bg-purple-50 border-purple-200' : 
          isReadyToExit ? 'bg-green-50 border-green-200' : 
          'bg-zinc-200 border-zinc-300'}`}>
        {/* Windshield / Window */}
        <div className="absolute top-1.5 left-2 right-1 h-5 bg-zinc-800 rounded-tr-lg rounded-bl-sm border border-black/5 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-400/20 via-transparent to-transparent" />
          {/* Driver Silhouette */}
          <div className="absolute bottom-0 right-2 w-2.5 h-2.5 bg-zinc-700/50 rounded-full blur-[1px]" />
        </div>
        
        {/* Side Mirror */}
        <div className={`absolute -right-1 top-3 w-1.5 h-3.5 rounded-sm border-r transition-colors 
          ${isCharging ? 'bg-blue-200 border-blue-300' : 
            isLoading ? 'bg-orange-200 border-orange-300' : 
            isUnloading ? 'bg-purple-200 border-purple-300' : 
            isReadyToExit ? 'bg-green-200 border-green-300' : 
            'bg-zinc-300 border-zinc-400'}`} />

        {/* Front Grille Detail */}
        <div className="absolute bottom-2.5 left-0 right-0 px-2 space-y-0.5">
          <div className={`h-[1px] w-full transition-colors ${isActive ? 'bg-zinc-300' : 'bg-zinc-300'}`} />
          <div className={`h-[1px] w-full opacity-50 transition-colors ${isActive ? 'bg-zinc-300' : 'bg-zinc-300'}`} />
        </div>

        {/* Neon Headlight - Subtler Glow */}
        <div className={`absolute bottom-1.5 left-1.5 w-2 h-3.5 rounded-full transition-all 
          ${isCharging ? 'bg-green-500 shadow-[0_0_12px_rgba(34,197,94,0.8)]' : 
            isLoading ? 'bg-orange-500 shadow-[0_0_12px_rgba(249,115,22,0.8)]' : 
            isUnloading ? 'bg-purple-500 shadow-[0_0_12px_rgba(168,85,247,0.8)]' : 
            isReadyToExit ? 'bg-green-400 shadow-[0_0_12px_rgba(74,222,128,0.8)]' : 
            'bg-blue-600 shadow-[0_0_8px_rgba(37,99,235,0.4)] group-hover:shadow-[0_0_12px_rgba(37,99,235,0.6)]'}`} />
      </div>

      {/* Trailer Connection Gap */}
      <div className={`w-1 h-4 self-end mb-2 flex-shrink-0 transition-colors ${isActive ? 'bg-zinc-100' : 'bg-zinc-200'}`} />

      {/* Trailer Body (The Info Card) - Light Glassmorphism */}
      <div className={`relative flex-grow backdrop-blur-md border shadow-lg overflow-hidden flex flex-col transition-colors h-full 
        ${isDocked ? 'rounded-l-xl rounded-r-none border-r-0' : 'rounded-xl'}
        ${isCharging ? 'bg-blue-50/90 border-blue-200 group-hover:border-blue-400' : 
          isLoading ? 'bg-orange-50/90 border-orange-200 group-hover:border-orange-400' : 
          isUnloading ? 'bg-purple-50/90 border-purple-200 group-hover:border-purple-400' : 
          isReadyToExit ? 'bg-green-50/90 border-green-200 group-hover:border-green-400' : 
          'bg-white/80 border-zinc-200 group-hover:border-blue-500/30'}`}>
        
        {/* Progress Fill Animation */}
        {(isLoading || isUnloading) && (
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${vehicle.progress || 0}%` }}
            transition={{ duration: 1, ease: "easeOut" }}
            className={`absolute inset-y-0 left-0 opacity-10 pointer-events-none ${isLoading ? 'bg-orange-500' : 'bg-purple-500'}`}
          />
        )}

        {/* Progress Bar Top */}
        <div className="h-1 w-full bg-zinc-100 relative overflow-hidden">
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${vehicle.progress || 0}%` }}
            transition={{ duration: 1, ease: "easeOut" }}
            className={`h-full ${isCharging ? 'bg-green-500' : isLoading ? 'bg-orange-500' : isUnloading ? 'bg-purple-500' : isReadyToExit ? 'bg-green-600' : 'bg-blue-600'}`}
          />
          {isActive && (
            <motion.div 
              animate={{ x: ['-100%', '200%'] }}
              transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
              className="absolute inset-0 bg-white/30 skew-x-12"
            />
          )}
        </div>
        
        <div className="p-2.5 flex-grow flex flex-col justify-between">
          {/* Top Section: ID and Status */}
          <div className="space-y-0.5">
            <div className="flex items-center justify-between">
              <span className="text-base font-black text-zinc-900 font-mono tracking-wider uppercase leading-none">
                {vehicle.vehicleNo}
              </span>
              <div className="flex items-center gap-1 flex-shrink-0">
                {isCharging ? (
                  <div className="flex items-center gap-1 bg-green-500/10 px-1.5 py-0.5 rounded-full border border-green-500/20">
                    <Zap size={8} className="text-green-600 fill-green-600 animate-pulse" />
                    <span className="text-[7px] font-black text-green-600 uppercase tracking-tighter">
                      Charging {vehicle.chargeLevel}%
                    </span>
                  </div>
                ) : isLoading ? (
                  <div className="flex items-center gap-1 bg-orange-500/10 px-1.5 py-0.5 rounded-full border border-orange-500/20">
                    <motion.div animate={{ y: [0, -2, 0] }} transition={{ repeat: Infinity, duration: 1.5 }}>
                      <Building2 size={8} className="text-orange-600" />
                    </motion.div>
                    <span className="text-[7px] font-black text-orange-600 uppercase tracking-tighter">
                      Loading
                    </span>
                  </div>
                ) : isUnloading ? (
                  <div className="flex items-center gap-1 bg-purple-500/10 px-1.5 py-0.5 rounded-full border border-purple-500/20">
                    <motion.div animate={{ y: [0, 2, 0] }} transition={{ repeat: Infinity, duration: 1.5 }}>
                      <Building2 size={8} className="text-purple-600" />
                    </motion.div>
                    <span className="text-[7px] font-black text-purple-600 uppercase tracking-tighter">
                      Unloading
                    </span>
                  </div>
                ) : isReadyToExit ? (
                  <div className="flex items-center gap-1 bg-green-500/10 px-1.5 py-0.5 rounded-full border border-green-500/20">
                    <Truck size={8} className="text-green-600" />
                    <span className="text-[7px] font-black text-green-600 uppercase tracking-tighter">
                      Ready to Exit
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full shadow-[0_0_4px_rgba(34,197,94,0.3)]" />
                    <span className="text-[9px] font-black text-zinc-500 uppercase tracking-tighter">
                      {vehicle.status || 'Parked'}
                    </span>
                  </div>
                )}
              </div>
            </div>
            
            <div className="flex items-center justify-between gap-2">
              <div className={`text-[11px] font-bold truncate uppercase tracking-tight flex-1
                ${isCharging ? 'text-blue-700' : 
                  isLoading ? 'text-orange-700' : 
                  isUnloading ? 'text-purple-700' : 
                  isReadyToExit ? 'text-green-700' : 
                  'text-blue-600'}`}>
                {vehicle.transport}
              </div>
              {/* Duration Display aligned with Transport - Increased font size and clarity */}
              {isCharging || isLoading || isUnloading ? (
                dockDuration && <span className={`text-[12px] font-black font-mono leading-none ${isCharging ? 'text-green-600' : isLoading ? 'text-orange-600' : 'text-purple-600'}`}>{dockDuration}</span>
              ) : (
                yardDuration && (
                  <div className="flex items-center gap-1.5">
                    {isLongStay && !vehicle.rawCheckOutDate && (
                      <div className="flex items-center gap-0.5 bg-red-500/10 px-1 py-0.5 rounded-sm border border-red-500/20">
                        <AlertTriangle size={8} className="text-red-600" />
                        <span className="text-[7px] font-black text-red-600 uppercase tracking-tighter">Long Stay</span>
                      </div>
                    )}
                    <span className={`text-[12px] font-black font-mono leading-none 
                      ${isReadyToExit ? 'text-green-600' : 
                        isLongStay && !vehicle.rawCheckOutDate ? 'text-red-600' : 
                        'text-zinc-500'}`}>
                      {yardDuration}
                    </span>
                  </div>
                )
              )}
            </div>
          </div>

          {/* Bottom Section: Client and Arrival */}
          <div className={`flex items-center justify-between pt-1.5 border-t 
            ${isCharging ? 'border-blue-100' : 
              isLoading ? 'border-orange-100' : 
              isUnloading ? 'border-purple-100' : 
              isReadyToExit ? 'border-green-100' : 
              'border-zinc-100'}`}>
            <div className="flex items-center gap-1.5 min-w-0 flex-1">
              <User size={12} className="text-zinc-400 flex-shrink-0" />
              <span className="text-[11px] font-bold text-zinc-600 truncate">{vehicle.customer}</span>
            </div>
            <div className="flex items-center gap-1.5 flex-shrink-0 pl-2">
              <Clock size={12} className="text-zinc-400" />
              <span className={`text-[11px] font-bold font-mono 
                ${isCharging ? 'text-blue-700' : 
                  isLoading ? 'text-orange-700' : 
                  isUnloading ? 'text-purple-700' : 
                  isReadyToExit ? 'text-green-700' : 
                  'text-blue-600'}`}>{shortTime}</span>
            </div>
          </div>
        </div>

        {/* Rear Reflectors */}
        <div className={`absolute right-0 top-0 bottom-0 w-0.5 
          ${isCharging ? 'bg-green-500/40' : 
            isLoading ? 'bg-orange-500/40' : 
            isUnloading ? 'bg-purple-500/40' : 
            isReadyToExit ? 'bg-green-500/40' : 
            'bg-red-500/30'}`} />
      </div>

      {/* Wheels - Positioned for a Truck/Trailer combo */}
      <div className="absolute -bottom-1.5 left-0 right-0 flex justify-between px-4 z-40 pointer-events-none">
        {/* Front Wheel (Cabin) */}
        <div className={`w-5 h-5 rounded-full border-2 shadow-sm transition-colors 
          ${isCharging ? 'bg-blue-900 border-blue-200' : 
            isLoading ? 'bg-orange-900 border-orange-200' : 
            isUnloading ? 'bg-purple-900 border-purple-200' : 
            isReadyToExit ? 'bg-green-900 border-green-200' : 
            'bg-zinc-900 border-zinc-100'}`} />
        
        {/* Rear Wheels (Trailer) */}
        <div className="flex gap-1.5">
          <div className={`w-5 h-5 rounded-full border-2 shadow-sm transition-colors 
            ${isCharging ? 'bg-blue-900 border-blue-200' : 
              isLoading ? 'bg-orange-900 border-orange-200' : 
              isUnloading ? 'bg-purple-900 border-purple-200' : 
              isReadyToExit ? 'bg-green-900 border-green-200' : 
              'bg-zinc-900 border-zinc-100'}`} />
          <div className={`w-5 h-5 rounded-full border-2 shadow-sm transition-colors 
            ${isCharging ? 'bg-blue-900 border-blue-200' : 
              isLoading ? 'bg-orange-900 border-orange-200' : 
              isUnloading ? 'bg-purple-900 border-purple-200' : 
              isReadyToExit ? 'bg-green-900 border-green-200' : 
              'bg-zinc-900 border-zinc-100'}`} />
        </div>
      </div>
    </motion.div>
  );
}
