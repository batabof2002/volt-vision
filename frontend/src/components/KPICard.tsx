import React from 'react';

interface KPICardProps {
  title: string;
  value: string | number;
  unit: string;
  subtitle?: string;
  icon?: string;
  color?: 'blue' | 'green' | 'yellow' | 'purple' | 'orange' | 'red';
}

const colorClasses = {
  blue: 'from-blue-500 to-blue-600',
  green: 'from-green-500 to-green-600',
  yellow: 'from-yellow-500 to-yellow-600',
  purple: 'from-purple-500 to-purple-600',
  orange: 'from-orange-500 to-orange-600',
  red: 'from-red-500 to-red-600',
};

export default function KPICard({ 
  title, 
  value, 
  unit, 
  subtitle, 
  icon, 
  color = 'blue' 
}: KPICardProps) {
  return (
    <div className="bg-slate-800 rounded-lg p-6 border border-slate-700 hover:border-slate-600 transition-all">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-slate-400 text-sm font-medium">{title}</p>
          <div className="mt-2 flex items-baseline">
            <p className={`text-3xl font-bold bg-gradient-to-r ${colorClasses[color]} bg-clip-text text-transparent`}>
              {typeof value === 'number' ? value.toLocaleString() : value}
            </p>
            <span className="ml-2 text-slate-400 text-lg">{unit}</span>
          </div>
          {subtitle && (
            <p className="mt-1 text-slate-500 text-sm">{subtitle}</p>
          )}
        </div>
        {icon && (
          <div className="text-3xl ml-4">{icon}</div>
        )}
      </div>
    </div>
  );
}
