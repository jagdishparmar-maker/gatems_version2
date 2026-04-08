'use client';

import React from 'react';
import { X, Truck } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import type { VehicleToastVariant } from '@/lib/vehicle-realtime-notify';

export type ToastItem = {
  id: string;
  title: string;
  description?: string;
  variant: VehicleToastVariant;
};

type VehicleToastStackProps = {
  toasts: ToastItem[];
  onDismiss: (id: string) => void;
};

const variantStyles: Record<
  VehicleToastVariant,
  { bar: string; title: string; ring: string }
> = {
  info: {
    bar: 'bg-blue-600',
    title: 'text-zinc-900',
    ring: 'border-blue-200 bg-white',
  },
  success: {
    bar: 'bg-emerald-600',
    title: 'text-zinc-900',
    ring: 'border-emerald-200 bg-white',
  },
  warning: {
    bar: 'bg-amber-500',
    title: 'text-zinc-900',
    ring: 'border-amber-200 bg-white',
  },
};

export default function VehicleToastStack({
  toasts,
  onDismiss,
}: VehicleToastStackProps) {
  return (
    <div
      className="fixed top-4 right-4 z-[200] flex flex-col gap-2 max-w-[min(100vw-2rem,22rem)] pointer-events-none"
      aria-live="polite"
      aria-relevant="additions"
    >
      <AnimatePresence mode="popLayout">
        {toasts.map((toast) => {
          const s = variantStyles[toast.variant];
          return (
            <motion.div
              key={toast.id}
              layout
              initial={{ opacity: 0, x: 40, scale: 0.96 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 24, scale: 0.96 }}
              transition={{ type: 'spring', stiffness: 420, damping: 28 }}
              className={`pointer-events-auto flex overflow-hidden rounded-lg border shadow-lg ${s.ring}`}
            >
              <div className={`w-1 shrink-0 ${s.bar}`} />
              <div className="flex min-w-0 flex-1 items-start gap-2 py-3 pl-3 pr-2">
                <div className="mt-0.5 rounded-sm bg-zinc-100 p-1.5 text-blue-600">
                  <Truck size={14} strokeWidth={2.5} />
                </div>
                <div className="min-w-0 flex-1">
                  <p
                    className={`text-[11px] font-black uppercase tracking-[0.12em] ${s.title}`}
                  >
                    {toast.title}
                  </p>
                  {toast.description ? (
                    <p className="mt-0.5 text-xs font-semibold text-zinc-600 leading-snug">
                      {toast.description}
                    </p>
                  ) : null}
                </div>
                <button
                  type="button"
                  onClick={() => onDismiss(toast.id)}
                  className="shrink-0 rounded p-1 text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-700"
                  aria-label="Dismiss notification"
                >
                  <X size={14} />
                </button>
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
