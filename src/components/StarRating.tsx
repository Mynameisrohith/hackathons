
"use client";

import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StarRatingProps {
  rating: number;
  maxRating?: number;
  className?: string;
  starClassName?: string;
}

export function StarRating({ rating, maxRating = 5, className, starClassName }: StarRatingProps) {
  return (
    <div className={cn('flex items-center gap-0.5', className)}>
      {[...Array(maxRating)].map((_, index) => {
        const starValue = index + 1;
        return (
          <Star
            key={index}
            className={cn(
              'h-5 w-5',
              starValue <= rating ? 'text-yellow-400 fill-yellow-400' : 'text-muted-foreground/30',
              starClassName
            )}
          />
        );
      })}
    </div>
  );
}
