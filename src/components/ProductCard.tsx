
"use client";

import Image from 'next/image';
import Link from 'next/link';
import type { Product } from '@/lib/types';

export function ProductCard({ product, delay = 0 }: { product: Product, delay?: number }) {
  return (
    <Link href={`/product/${product.id}`} className="group relative block overflow-hidden rounded-lg animate-card-enter hover-lift" style={{ animationDelay: `${delay}ms` }}>
      <div className="overflow-hidden rounded-lg">
        <Image
          src={product.imageUrl}
          alt={product.name}
          width={500}
          height={500}
          className="h-auto w-full object-cover aspect-square transition-transform duration-500 ease-in-out group-hover:scale-105"
        />
      </div>
      <div className="mt-4">
        <h3 className="text-sm font-medium text-foreground group-hover:text-primary">{product.name}</h3>
        <p className="mt-1 text-lg font-semibold text-foreground">${product.price.toFixed(2)}</p>
      </div>
    </Link>
  );
}
