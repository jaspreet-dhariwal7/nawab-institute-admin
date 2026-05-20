import { TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '../lib/utlis.js';
import { motion } from 'framer-motion';

export default function StatsCard({ 
  icon: Icon, 
  label, 
  value, 
  trend, 
  trendType, 
  colorClass,
  isAccent = false 
}) {
  return (
    <motion.div 
      whileHover={{ y: -5 }}
      className={cn(
        "p-5 rounded-xl border transition-all h-full",
        isAccent 
          ? "bg-primary border-primary shadow-lg" 
          : "bg-surface-container-lowest border-outline-variant shadow-sm hover:shadow-md"
      )}
    >
      <div className={cn(
        "w-12 h-12 rounded-lg mb-4 flex items-center justify-center",
        isAccent 
          ? "bg-secondary-container text-on-secondary-container" 
          : cn("bg-surface-container-low", colorClass)
      )}>
        <Icon className="w-6 h-6" />
      </div>
      
      <p className={cn(
        "text-[10px] font-bold uppercase tracking-wider mb-1",
        isAccent ? "text-on-primary/60" : "text-on-surface-variant"
      )}>
        {label}
      </p>
      
      <div className="flex items-end justify-between">
        <h3 className={cn(
          "text-2xl font-bold",
          isAccent ? "text-on-primary" : "text-on-surface"
        )}>
          {value}
        </h3>
        
        {trend && (
          <span className={cn(
            "text-[10px] font-bold flex items-center gap-0.5",
            trendType === 'up' && "text-green-600",
            trendType === 'down' && "text-error",
            trendType === 'neutral' && "text-on-surface-variant",
            isAccent && trendType === 'up' && "text-secondary-container"
          )}>
            {trend}
            {trendType === 'up' && <TrendingUp className="w-3 h-3" />}
            {trendType === 'down' && <TrendingDown className="w-3 h-3" />}
          </span>
        )}
      </div>
    </motion.div>
  );
}
