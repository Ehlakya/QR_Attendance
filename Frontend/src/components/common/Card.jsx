import { cn } from '../../utils/cn';

export const Card = ({ children, className, ...props }) => {
  return (
    <div className={cn("bg-card text-textPrimary rounded-xl border border-border shadow-sm", className)} {...props}>
      {children}
    </div>
  );
};

export const CardHeader = ({ children, className, ...props }) => {
  return (
    <div className={cn("px-6 py-4 border-b border-border flex items-center justify-between", className)} {...props}>
      {children}
    </div>
  );
};

export const CardTitle = ({ children, className, ...props }) => {
  return (
    <h3 className={cn("text-lg font-semibold text-textPrimary", className)} {...props}>
      {children}
    </h3>
  );
};

export const CardContent = ({ children, className, ...props }) => {
  return (
    <div className={cn("p-6", className)} {...props}>
      {children}
    </div>
  );
};
