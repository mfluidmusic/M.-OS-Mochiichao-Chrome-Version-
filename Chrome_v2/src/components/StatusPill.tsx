import React from 'react';

// Status colors based on classic RGB
const statusColors: Record<string, string> = {
  BRN: '#F08030', // Red
  PAR: '#F8D030', // Yellow
  PSN: '#A040A0', // Purple
  SLP: '#B8B8D0', // Silver/Gray
  FRZ: '#98D8D8', // Ice Blue
  TOX: '#7038F8', // Deep Purple
};

export const StatusPill = ({ status }: { status: string }) => {
  if (!status || status === 'NONE') return null;
  const bgColor = statusColors[status] || '#FFFFFF';

  return (
    <span
      className="ml-2 inline-flex items-center justify-center px-1.5 py-[1px] rounded text-[9px] font-black tracking-wider uppercase text-black"
      style={{ backgroundColor: bgColor, boxShadow: '0 1px 2px rgba(0,0,0,0.5)' }}
    >
      {status}
    </span>
  );
};

export const MathHPBar = ({ current, max }: { current: number; max: number }) => {
  const percentage = Math.max(0, Math.min(100, (current / max) * 100));
  
  let hpColor = '';
  if (percentage > 50) hpColor = '#34d399'; // Emerald-400
  else if (percentage > 20) hpColor = '#fbbf24'; // Amber-400
  else hpColor = '#ef4444'; // Red-500

  const isLowHealth = percentage <= 20;

  return (
    <div className={`mt-1 bg-black/50 border ${isLowHealth ? 'border-red-500/50 animate-pulse' : 'border-white/20'} rounded-full h-1.5 overflow-hidden w-full relative`}>
      <div
        className="h-full transition-all duration-300 ease-out"
        style={{ width: `${percentage}%`, backgroundColor: hpColor }}
      />
    </div>
  );
};
