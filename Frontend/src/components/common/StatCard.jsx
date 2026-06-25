import { Card, CardContent } from './Card';
import { cn } from '../../utils/cn';

const StatCard = ({ title, value, icon: Icon, trend, trendValue, color = "primary" }) => {
  const colorMap = {
    primary: "text-primary bg-primary/10",
    success: "text-success bg-success/10",
    warning: "text-warning bg-warning/10",
    danger: "text-danger bg-danger/10",
    secondary: "text-secondary bg-secondary/10",
  };

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-sm font-medium text-textSecondary mb-1">{title}</p>
            <h4 className="text-3xl font-bold text-gray-900">{value}</h4>
            
            {trend && (
              <div className="flex items-center gap-1 mt-2">
                <span className={cn(
                  "text-xs font-medium",
                  trend === 'up' ? "text-success" : "text-danger"
                )}>
                  {trend === 'up' ? '↑' : '↓'} {trendValue}
                </span>
                <span className="text-xs text-textSecondary">vs last month</span>
              </div>
            )}
          </div>
          
          <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center", colorMap[color] || colorMap.primary)}>
            <Icon className="w-6 h-6" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default StatCard;
