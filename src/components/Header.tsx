
"use client";

import Link from 'next/link';
import { RetailSparkIcon } from './icons';
import { SearchBar } from './SearchBar';
import { Button } from './ui/button';
import { ShoppingCart, User, ChevronDown, Menu, Package, LogOut, UserCog, Shield } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import { useCart } from '@/context/CartContext';
import { Badge } from './ui/badge';
import { useUser, useAuth } from '@/firebase';
import { useRole } from '@/hooks/useAdmin';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuGroup,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetHeader,
  SheetTitle
} from '@/components/ui/sheet';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Skeleton } from './ui/skeleton';
import { useIsMobile } from '@/hooks/use-mobile';
import { useState } from 'react';

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
  const auth = useAuth();
  const { role, isLoading: isRoleLoading } = useRole();

  const handleLogout = () => {
    if (auth) {
      auth.signOut();
    }
  };

  if (isUserLoading || isRoleLoading) {
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
            <DropdownMenuGroup>
                <DropdownMenuItem asChild>
                    <Link href="/profile">
                        <UserCog className="mr-2 h-4 w-4" />
                        <span>{t('profileTitle')}</span>
                    </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                    <Link href="/my-orders">
                        <Package className="mr-2 h-4 w-4" />
                        <span>{t('myOrders')}</span>
                    </Link>
                </DropdownMenuItem>
                {role === 'admin' && (
                    <DropdownMenuItem asChild>
                        <Link href="/admin/dashboard">
                            <Shield className="mr-2 h-4 w-4" />
                            <span>{t('adminPanel')}</span>
                        </Link>
                    </DropdownMenuItem>
                )}
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" />
                <span>{t('logout')}</span>
            </DropdownMenuItem>
        </DropdownMenuContent>
    </DropdownMenu>
  );
}

const NavMenu = () => {
    const { t } = useLanguage();
    return (
        <nav className="hidden items-center gap-2 md:flex">
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost">{t('shop')} <ChevronDown className="ml-1 h-4 w-4" /></Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                    <DropdownMenuItem asChild><Link href="/products">{t('allProducts')}</Link></DropdownMenuItem>
                    <DropdownMenuItem asChild><Link href="/categories">{t('categories')}</Link></DropdownMenuItem>
                    <DropdownMenuItem asChild><Link href="/new-arrivals">{t('newArrivals')}</Link></DropdownMenuItem>
                    <DropdownMenuItem asChild><Link href="/deals">{t('deals')}</Link></DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
             <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost">{t('company')} <ChevronDown className="ml-1 h-4 w-4" /></Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                    <DropdownMenuItem asChild><Link href="/about">{t('aboutUs')}</Link></DropdownMenuItem>
                    <DropdownMenuItem asChild><Link href="/careers">{t('careers')}</Link></DropdownMenuItem>
                    <DropdownMenuItem asChild><Link href="/press">{t('press')}</Link></DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
             <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost">{t('support')} <ChevronDown className="ml-1 h-4 w-4" /></Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                    <DropdownMenuItem asChild><Link href="/contact">{t('contactUs')}</Link></DropdownMenuItem>
                    <DropdownMenuItem asChild><Link href="/faq">{t('faq')}</Link></DropdownMenuItem>
                    <DropdownMenuItem asChild><Link href="/shipping-returns">{t('shippingReturns')}</Link></DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        </nav>
    );
};

const MobileNavMenu = ({ setOpen }: { setOpen: (open: boolean) => void }) => {
    const { t } = useLanguage();
    const closeSheet = () => setOpen(false);

    return (
      <nav className="flex flex-col gap-4 p-4 text-lg font-medium">
          <div className='space-y-2'>
            <p className='text-muted-foreground text-sm font-semibold uppercase'>{t('shop')}</p>
            <Link href="/products" onClick={closeSheet} className="block hover:text-primary">{t('allProducts')}</Link>
            <Link href="/categories" onClick={closeSheet} className="block hover:text-primary">{t('categories')}</Link>
            <Link href="/new-arrivals" onClick={closeSheet} className="block hover:text-primary">{t('newArrivals')}</Link>
            <Link href="/deals" onClick={closeSheet} className="block hover:text-primary">{t('deals')}</Link>
          </div>
          <DropdownMenuSeparator />
           <div className='space-y-2'>
            <p className='text-muted-foreground text-sm font-semibold uppercase'>{t('company')}</p>
            <Link href="/about" onClick={closeSheet} className="block hover:text-primary">{t('aboutUs')}</Link>
            <Link href="/careers" onClick={closeSheet} className="block hover:text-primary">{t('careers')}</Link>
            <Link href="/press" onClick={closeSheet} className="block hover:text-primary">{t('press')}</Link>
          </div>
          <DropdownMenuSeparator />
          <div className='space-y-2'>
            <p className='text-muted-foreground text-sm font-semibold uppercase'>{t('support')}</p>
            <Link href="/contact" onClick={closeSheet} className="block hover:text-primary">{t('contactUs')}</Link>
            <Link href="/faq" onClick={closeSheet} className="block hover:text-primary">{t('faq')}</Link>
            <Link href="/shipping-returns" onClick={closeSheet} className="block hover:text-primary">{t('shippingReturns')}</Link>
          </div>
      </nav>
    );
};

export function Header() {
  const { t } = useLanguage();
  const { cartCount } = useCart();
  const isMobile = useIsMobile();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 p-4">
      <div className="container mx-auto px-4 py-3 glass-navbar">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-6">
            <Link href="/" className="flex items-center gap-2">
              <RetailSparkIcon className="size-8 text-primary" />
              <span className="hidden text-xl font-semibold text-primary sm:block">RetailSpark</span>
            </Link>
            <NavMenu />
          </div>

          <div className="flex-1 max-w-sm hidden lg:block">
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
            {isMobile && (
                 <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                    <SheetTrigger asChild>
                        <Button variant="ghost" size="icon"><Menu /></Button>
                    </SheetTrigger>
                    <SheetContent>
                        <SheetHeader className="border-b pb-4">
                            <SheetTitle>Menu</SheetTitle>
                        </SheetHeader>
                        <MobileNavMenu setOpen={setMobileMenuOpen}/>
                    </SheetContent>
                </Sheet>
            )}
          </div>
        </div>
        <div className="lg:hidden mt-4">
            <SearchBar />
        </div>
      </div>
    </header>
  );
}
