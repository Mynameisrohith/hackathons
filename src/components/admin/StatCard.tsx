
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface StatCardProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string;
  value: string;
  icon: React.ElementType;
  change?: string;
  changeType?: "increase" | "decrease";
}

export function StatCard({ title, value, icon: Icon, change, changeType, className, ...props }: StatCardProps) {
  return (
    <Card className={cn("card-glass", className)} {...props}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {change && (
          <p className="text-xs text-muted-foreground">
            <span className={cn(
                "font-semibold",
                changeType === 'increase' ? 'text-green-500' : 'text-red-500'
            )}>
                {change}
            </span>
            {' '}from last month
          </p>
        )}
      </CardContent>
    </Card>
  );
}
