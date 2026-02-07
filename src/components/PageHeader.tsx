
"use client";

import { cn } from "@/lib/utils";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  className?: string;
}

export function PageHeader({ title, subtitle, className }: PageHeaderProps) {
  return (
    <section className={cn("relative overflow-hidden bg-gradient-to-b from-primary/5 to-background py-16 sm:py-20", className)}>
        <div className="absolute top-0 left-0 -z-10 h-full w-full bg-grid-slate-900/[0.04] [mask-image:radial-gradient(100%_50%_at_50%_0%,rgba(255,255,255,0.7)_0,rgba(255,255,255,0)_100%)]"></div>
        <div className="container mx-auto px-4 text-center">
            <h1 className="text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl">
            {title}
            </h1>
            {subtitle && (
            <p className="mt-6 max-w-2xl mx-auto text-lg leading-8 text-muted-foreground">
                {subtitle}
            </p>
            )}
        </div>
    </section>
  );
}
