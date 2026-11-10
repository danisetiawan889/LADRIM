'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Check,
  Package,
  Plane,
  Building2,
  Truck,
  CheckCircle2,
  Copy,
  ChevronDown,
  Clock,
  MapPin,
  LucideIcon,
} from 'lucide-react';
import { lux } from '@/lib/motion';

export type TrackingState = 'ORDERED' | 'SHIPPED' | 'IN_CUSTOMS' | 'OUT_FOR_DELIVERY' | 'DELIVERED';

export interface TrackingStep {
  state: TrackingState;
  label: string;
  step_number: number;
  is_completed: boolean;
  is_current: boolean;
}

export interface TrackingHistoryEvent {
  raw_status: string;
  mapped_state: TrackingState;
  location: string | null;
  event_time: string;
}

export interface TrackingData {
  order_id: string;
  tracking_number: string | null;
  courier: string | null;
  destination_country?: string;
  is_international?: boolean;
  current_state: TrackingState;
  state_index: number;
  ui_title: string;
  ui_description: string;
  updated_at: string;
  steps: TrackingStep[];
  history?: TrackingHistoryEvent[];
}

interface OrderTrackerProps {
  data: TrackingData;
  className?: string;
}

const STEP_ICONS: Record<TrackingState, LucideIcon> = {
  ORDERED: Package,
  SHIPPED: Plane,
  IN_CUSTOMS: Building2,
  OUT_FOR_DELIVERY: Truck,
  DELIVERED: CheckCircle2,
};

export default function OrderTracker({ data, className = '' }: OrderTrackerProps) {
  const [copied, setCopied] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  const handleCopy = () => {
    if (data.tracking_number) {
      navigator.clipboard.writeText(data.tracking_number);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Calculate percentage for progress line (0% to 100%)
  const progressPercent = Math.min(100, Math.max(0, ((data.state_index - 1) / (data.steps.length - 1)) * 100));

  return (
    <div className={`glass border border-neutral-200/80 rounded-sm p-4 sm:p-6 shadow-xs w-full max-w-full min-w-0 ${className}`}>
      {/* ──── HEADER INFO BAR ──── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-black/10 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-black text-white">
              {data.courier || (data.is_international ? `International (${data.destination_country || 'Express'})` : 'Standard Delivery')}
            </span>
            <span className="text-xs text-neutral-500 font-mono">
              #{data.order_id.slice(0, 8)}...
            </span>
          </div>

          {data.tracking_number && (
            <div className="flex items-center gap-2 mt-1.5">
              <span className="text-xs text-neutral-500 font-medium">Tracking:</span>
              <span className="text-xs font-mono font-bold text-ink tracking-wider bg-neutral-100 px-2 py-0.5 rounded">
                {data.tracking_number}
              </span>
              <button
                type="button"
                onClick={handleCopy}
                aria-label="Copy tracking number"
                className="text-neutral-500 hover:text-ink transition-colors p-1"
                title="Copy tracking number"
              >
                {copied ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
              </button>
            </div>
          )}
        </div>

        <div className="text-left sm:text-right">
          <div className="flex items-center sm:justify-end gap-1.5 text-xs text-neutral-500">
            <Clock size={13} />
            <span>Updated:</span>
            <span className="font-semibold text-ink">
              {new Date(data.updated_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })},{' '}
              {new Date(data.updated_at).toLocaleDateString([], { month: 'short', day: 'numeric' })}
            </span>
          </div>
        </div>
      </div>

      {/* ──── CURRENT MACRO STATE HERO BANNER ──── */}
      <div className="py-5 sm:py-6">
        <div className="flex items-start gap-3.5">
          <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-ink text-white flex items-center justify-center shrink-0 shadow-sm">
            {React.createElement(STEP_ICONS[data.current_state] || Package, { size: 22 })}
          </div>
          <div className="flex-1 min-w-0">
            <span className="text-[10px] font-bold tracking-widest uppercase text-neutral-500 block mb-0.5">
              Current Shipment Status
            </span>
            <h3 className="font-display font-bold text-lg sm:text-2xl text-ink leading-tight">
              {data.ui_title}
            </h3>
            <p className="text-xs sm:text-sm text-neutral-600 mt-1 leading-relaxed">
              {data.ui_description}
            </p>
          </div>
        </div>
      </div>

      {/* ──── 5-STAGE PROGRESS BAR (GYMSHARK STYLE) ──── */}
      <div className="pt-2 pb-6 px-1 sm:px-4">
        {/* Progress Tracker Wrapper */}
        <div className="relative">
          {/* Background Track Line */}
          <div className="absolute top-4 left-0 right-0 h-1 bg-neutral-200 -translate-y-1/2 z-0 rounded-full" />

          {/* Active Fill Track Line */}
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progressPercent}%` }}
            transition={{ duration: 0.8, ease: lux }}
            className="absolute top-4 left-0 h-1 bg-ink -translate-y-1/2 z-0 rounded-full"
          />

          {/* 5 Milestone Nodes */}
          <div className="relative z-10 flex items-center justify-between">
            {data.steps.map((step) => {
              const Icon = STEP_ICONS[step.state] || Package;

              return (
                <div key={step.state} className="flex flex-col items-center">
                  {/* Circular Node */}
                  <div
                    className={`h-8 w-8 sm:h-9 sm:w-9 rounded-full flex items-center justify-center transition-all duration-300 ${
                      step.is_current
                        ? 'bg-ink text-white ring-4 ring-black/10 scale-110 shadow-md'
                        : step.is_completed
                        ? 'bg-ink text-white'
                        : 'bg-white text-neutral-400 border-2 border-neutral-300'
                    }`}
                  >
                    {step.is_completed && !step.is_current ? (
                      <Check size={16} strokeWidth={2.5} />
                    ) : (
                      <Icon size={16} />
                    )}
                  </div>

                  {/* Stage Label */}
                  <span
                    className={`text-[10px] sm:text-xs mt-2 text-center max-w-[64px] sm:max-w-[80px] leading-tight font-medium transition-colors ${
                      step.is_current
                        ? 'font-bold text-ink'
                        : step.is_completed
                        ? 'text-neutral-800'
                        : 'text-neutral-400'
                    }`}
                  >
                    {step.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ──── DETAILED CARRIER EVENTS ACCORDION ──── */}
      {data.history && data.history.length > 0 && (
        <div className="border-t border-black/10 pt-3">
          <button
            type="button"
            onClick={() => setShowHistory((prev) => !prev)}
            className="w-full flex items-center justify-between text-xs font-semibold text-neutral-600 hover:text-ink transition-colors py-1 cursor-pointer"
          >
            <span>Detailed Carrier Checkpoints ({data.history.length})</span>
            <ChevronDown
              size={15}
              className={`transition-transform duration-300 ${showHistory ? 'rotate-180' : ''}`}
            />
          </button>

          <AnimatePresence>
            {showHistory && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3, ease: lux }}
                className="overflow-hidden pt-3 space-y-2.5"
              >
                {data.history.map((event, idx) => (
                  <div
                    key={idx}
                    className="flex items-start gap-2.5 text-xs text-neutral-600 border-l-2 border-neutral-300 pl-3 py-0.5"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-ink leading-snug">{event.raw_status}</p>
                      {event.location && (
                        <p className="text-[11px] text-neutral-500 flex items-center gap-1 mt-0.5">
                          <MapPin size={11} className="shrink-0" /> {event.location}
                        </p>
                      )}
                    </div>
                    <span className="text-[10px] text-neutral-400 shrink-0 font-mono">
                      {new Date(event.event_time).toLocaleDateString([], { month: 'numeric', day: 'numeric' })}{' '}
                      {new Date(event.event_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
