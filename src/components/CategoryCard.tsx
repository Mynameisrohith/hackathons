
"use client";

import Image from 'next/image';
import Link from 'next/link';
import type { Category } from '@/lib/types';
import { ArrowRight } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';

export function CategoryCard({ category }: { category: Category }) {
  const { t } = useLanguage();
  return (
    <Link href={`/category/${category.id}`} className="group relative block overflow-hidden rounded-lg border bg-white shadow-sm hover:shadow-lg transition-shadow">
      <div className="relative aspect-square">
        <Image
          src={category.imageUrl}
          alt={category.name}
          width={400}
          height={400}
          className="h-full w-full object-cover"
        />
      </div>
      <div className="p-3">
        <h3 className="text-base font-semibold text-foreground">{category.name}</h3>
      </div>
    </Link>
  );
}
