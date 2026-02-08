
"use client";

import Image from 'next/image';
import Link from 'next/link';
import type { Product } from '@/lib/types';
import { Star } from 'lucide-react';

export function ProductCard({ product, delay = 0 }: { product: Product, delay?: number }) {
  const randomRating = (Math.random() * (5 - 4) + 4).toFixed(1);
  const randomReviews = Math.floor(Math.random() * 2000) + 500;

  return (
    <Link href={`/product/${product.id}`} className="group block animate-card-enter" style={{ animationDelay: `${delay}ms` }}>
      <div className="overflow-hidden rounded-md bg-gray-100">
        <Image
          src={product.imageUrl}
          alt={product.name}
          width={500}
          height={500}
          className="h-auto w-full object-cover aspect-[4/3] transition-transform duration-300 ease-in-out group-hover:scale-105"
        />
      </div>
      <div className="mt-2">
        <h3 className="text-sm font-medium text-foreground truncate group-hover:text-primary">{product.name}</h3>
        <div className="flex items-center gap-2 mt-1">
            <div className="flex items-center">
                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                <span className="text-sm ml-1">{randomRating}</span>
            </div>
            <span className="text-sm text-muted-foreground">({randomReviews})</span>
        </div>
        <p className="mt-1 text-lg font-semibold text-foreground">${product.price.toFixed(2)}</p>
      </div>
    </Link>
  );
}
