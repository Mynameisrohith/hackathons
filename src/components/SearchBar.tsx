
"use client";

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Search } from 'lucide-react';
import { Input } from './ui/input';

export function SearchBar() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const params = new URLSearchParams(searchParams);
    if (e.target.value) {
      params.set('q', e.target.value);
    } else {
      params.delete('q');
    }
    
    // If not on the products page, navigate to it with the search query
    if (pathname !== '/products') {
        router.push(`/products?${params.toString()}`);
    } else {
        router.replace(`${pathname}?${params.toString()}`);
    }
  };

  return (
    <div className="relative w-full">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
      <Input
        type="search"
        placeholder="Search for products..."
        className="w-full pl-9"
        onChange={handleSearch}
        defaultValue={searchParams.get('q') || ''}
      />
    </div>
  );
}
