
"use client";

import Image from 'next/image';
import Link from 'next/link';
import type { Category } from '@/lib/types';
import { ArrowRight } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';

export function CategoryCard({ category }: { category: Category }) {
  const { t } = useLanguage();
  return (
    <Link href={`/category/${category.id}`} className="group relative block overflow-hidden rounded-xl">
      <Image
        src={category.imageUrl}
        alt={category.name}
        width={400}
        height={400}
        className="h-48 w-full object-cover transition-transform duration-500 ease-in-out group-hover:scale-110"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
      <div className="absolute bottom-0 left-0 p-4">
        <h3 className="text-xl font-bold text-white">{category.name}</h3>
        <div className="mt-2 flex items-center text-sm font-medium text-white/80 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
          {t('shopNow')} <ArrowRight className="ml-1 h-4 w-4" />
        </div>
      </div>
    </Link>
  );
}
