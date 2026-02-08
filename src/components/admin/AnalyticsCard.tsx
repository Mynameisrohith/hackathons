
import React from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface AnalyticsCardProps {
    title: string;
    icon: React.ElementType;
    metric?: string;
    footer?: string;
    iconClass?: string;
    children?: React.ReactNode;
}

export function AnalyticsCard({ title, icon: Icon, metric, footer, iconClass, children }: AnalyticsCardProps) {
    return (
        <Card className="card-glass flex flex-col">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{title}</CardTitle>
                <Icon className={cn("h-4 w-4 text-muted-foreground", iconClass)} />
            </CardHeader>
            <CardContent className="flex-1">
                {metric && <div className="text-2xl font-bold">{metric}</div>}
                {children}
            </CardContent>
            {footer && (
                 <CardFooter>
                    <p className="text-xs text-muted-foreground">{footer}</p>
                </CardFooter>
            )}
        </Card>
    );
}
