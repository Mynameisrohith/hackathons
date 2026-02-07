
"use client";

import Link from 'next/link';
import { RetailSparkIcon } from './icons';
import { SearchBar } from './SearchBar';
import { Button } from './ui/button';
import { ShoppingCart, User } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';

function LanguageSwitcher() {
    const { language, setLanguage } = useLanguage();
  
    return (
      <div className="flex items-center gap-1 rounded-md border bg-background p-1 text-sm">
        <button
          onClick={() => setLanguage('en')}
          className={`px-2 py-0.5 rounded-sm transition-colors ${
            language === 'en' ? 'bg-secondary text-secondary-foreground' : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          EN
        </button>
        <div className="h-4 w-px bg-border" />
        <button
          onClick={() => setLanguage('hi')}
          className={`px-2 py-0.5 rounded-sm transition-colors ${
            language === 'hi' ? 'bg-secondary text-secondary-foreground' : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          हिंदी
        </button>
      </div>
    );
}

export function Header() {
  const { t } = useLanguage();
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
              <Link href="/products" className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary">{t('products')}</Link>
              <Link href="/categories" className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary">{t('categories')}</Link>
            </nav>
          </div>

          <div className="flex-1 max-w-sm">
            <SearchBar />
          </div>

          <div className="flex items-center gap-2">
            <LanguageSwitcher />
            <Button variant="ghost" size="icon">
                <ShoppingCart className='h-5 w-5'/>
                <span className="sr-only">{t('cart')}</span>
            </Button>
             <Button variant="ghost" size="icon">
                <User className='h-5 w-5'/>
                <span className="sr-only">{t('profile')}</span>
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
