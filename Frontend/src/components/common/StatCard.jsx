import { useState, useEffect } from 'react';
import { Card, CardContent } from './Card';
import { cn } from '../../utils/cn';
import { motion } from 'framer-motion';

const AnimatedNumber = ({ end, duration = 2, decimals = 0, suffix = '' }) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let startTimestamp = null;
    const step = (timestamp) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / (duration * 1000), 1);
      
      // Easing function: easeOutExpo
      const easeProgress = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      
      setCount(easeProgress * end);
      
      if (progress < 1) {
        window.requestAnimationFrame(step);
      } else {
        setCount(end); // Ensure it perfectly hits the end value
      }
    };
    window.requestAnimationFrame(step);
  }, [end, duration]);

  return (
    <>
      {count.toLocaleString(undefined, { 
        minimumFractionDigits: decimals, 
        maximumFractionDigits: decimals 
      })}
      {suffix}
    </>
  );
};

const StatCard = ({ title, value, icon: Icon, trend, trendValue, color = "primary" }) => {
  const colorMap = {
    primary: "text-primary bg-primary/10 shadow-[0_0_15px_rgba(99,102,241,0.2)]",
    success: "text-success bg-success/10 shadow-[0_0_15px_rgba(16,185,129,0.2)]",
    warning: "text-warning bg-warning/10 shadow-[0_0_15px_rgba(245,158,11,0.2)]",
    danger: "text-danger bg-danger/10 shadow-[0_0_15px_rgba(239,68,68,0.2)]",
    secondary: "text-secondary bg-secondary/10 shadow-[0_0_15px_rgba(139,92,246,0.2)]",
  };

  const isPercentage = typeof value === 'string' && value.includes('%');
  const numericValue = parseFloat(value);

  return (
    <motion.div 
      whileHover={{ scale: 1.03, translateY: -5 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
    >
      <Card className="h-full border border-border shadow-sm hover:shadow-lg transition-shadow bg-card/80 backdrop-blur-xl">
        <CardContent className="p-6">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-semibold text-textSecondary mb-1 tracking-wide">{title}</p>
              <h4 className="text-3xl font-extrabold text-textPrimary tracking-tight">
                {(!isNaN(numericValue) && numericValue > 0) ? (
                  <AnimatedNumber 
                    end={numericValue} 
                    duration={2} 
                    decimals={isPercentage && numericValue % 1 !== 0 ? 2 : 0} 
                    suffix={isPercentage ? '%' : ''} 
                  />
                ) : (
                  value
                )}
              </h4>
              
              {trend && (
                <div className="flex items-center gap-1 mt-2">
                  <span className={cn(
                    "text-xs font-bold",
                    trend === 'up' ? "text-success" : "text-danger"
                  )}>
                    {trend === 'up' ? '↑' : '↓'} {trendValue}
                  </span>
                  <span className="text-xs text-textSecondary font-medium">vs last month</span>
                </div>
              )}
            </div>
            
            <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center backdrop-blur-md border border-white/10 dark:border-white/5", colorMap[color] || colorMap.primary)}>
              <Icon className="w-7 h-7" />
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default StatCard;
