
"use client";

import Link from 'next/link';
import { RetailSparkIcon } from './icons';
import { SearchBar } from './SearchBar';
import { Button } from './ui/button';
import { ShoppingCart, User } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import { useCart } from '@/context/CartContext';
import { Badge } from './ui/badge';
import { useUser } from '@/firebase';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Skeleton } from './ui/skeleton';

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
          onClick={() => setLanguage('kn')}
          className={`px-2 py-0.5 rounded-sm transition-colors ${
            language === 'kn' ? 'bg-secondary text-secondary-foreground' : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          ಕನ್ನಡ
        </button>
      </div>
    );
}

function UserButton() {
  const { t } = useLanguage();
  const { user, isUserLoading } = useUser();

  if (isUserLoading) {
    return <Skeleton className="h-8 w-8 rounded-full" />;
  }

  if (!user) {
    return (
      <Button asChild variant="ghost" size="icon">
        <Link href="/login">
          <User className='h-5 w-5'/>
          <span className="sr-only">{t('profile')}</span>
        </Link>
      </Button>
    )
  }

  return (
    <DropdownMenu>
        <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                <Avatar className="h-8 w-8">
                    <AvatarImage src={user.photoURL || ''} alt={user.displayName || ''} />
                    <AvatarFallback>
                        {user.displayName ? user.displayName.charAt(0).toUpperCase() : <User />}
                    </AvatarFallback>
                </Avatar>
            </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56" align="end" forceMount>
            <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{user.displayName}</p>
                    <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
                </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
                <Link href="/admin/analytics">
                    {t('adminPanel')}
                </Link>
            </DropdownMenuItem>
        </DropdownMenuContent>
    </DropdownMenu>
  );
}


export function Header() {
  const { t } = useLanguage();
  const { cartCount } = useCart();
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
            <Button asChild variant="ghost" size="icon" className="relative">
                <Link href="/cart">
                  <ShoppingCart className='h-5 w-5'/>
                  {cartCount > 0 && (
                    <Badge className="absolute -top-2 -right-2 h-5 w-5 justify-center p-0">{cartCount}</Badge>
                  )}
                  <span className="sr-only">{t('cart')}</span>
                </Link>
            </Button>
            <UserButton />
          </div>
        </div>
      </div>
    </header>
  );
}
