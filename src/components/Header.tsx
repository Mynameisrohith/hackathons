
"use client";

import Link from 'next/link';
import { RetailSparkIcon } from './icons';
import { SearchBar } from './SearchBar';
import { Button } from './ui/button';
import { ShoppingCart, User } from 'lucide-react';

export function Header() {
  return (
    <header className="sticky top-0 z-50 p-4">
      <div className="container mx-auto px-4 py-3 glass-navbar">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-6">
            <Link href="/" className="flex items-center gap-2">
              <RetailSparkIcon className="size-8 text-primary" />
              <span className="hidden text-xl font-semibold text-primary sm:block">RetailSpark</span>
            </Link>
            <nav className="hidden items-center gap-4 md:flex">
              <Link href="/products" className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary">Products</Link>
              <Link href="/categories" className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary">Categories</Link>
            </nav>
          </div>

          <div className="flex-1 max-w-sm">
            <SearchBar />
          </div>

          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon">
                <ShoppingCart className='h-5 w-5'/>
                <span className="sr-only">Cart</span>
            </Button>
             <Button variant="ghost" size="icon">
                <User className='h-5 w-5'/>
                <span className="sr-only">Profile</span>
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
