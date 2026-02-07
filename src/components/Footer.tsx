
"use client";

import Link from 'next/link';
import { RetailSparkIcon } from '@/components/icons';
import { Button } from './ui/button';
import { Shield } from 'lucide-react';

export function Footer() {
  return (
    <footer className="border-t bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
          <div className="md:col-span-1">
            <Link href="/" className="flex items-center gap-2">
                <RetailSparkIcon className="size-8 text-primary" />
                <span className="text-xl font-semibold text-primary">RetailSpark</span>
            </Link>
            <p className="mt-4 text-sm text-muted-foreground">
              Your Modern AI-Powered eCommerce Marketplace.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-8 md:col-span-3 md:grid-cols-4">
            <div>
              <h3 className="font-semibold">Shop</h3>
              <ul className="mt-4 space-y-2 text-sm">
                <li><Link href="/products" className="text-muted-foreground hover:text-primary">All Products</Link></li>
                <li><Link href="/categories" className="text-muted-foreground hover:text-primary">Categories</Link></li>
                <li><Link href="#" className="text-muted-foreground hover:text-primary">New Arrivals</Link></li>
                <li><Link href="#" className="text-muted-foreground hover:text-primary">Deals</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold">Company</h3>
              <ul className="mt-4 space-y-2 text-sm">
                <li><Link href="#" className="text-muted-foreground hover:text-primary">About Us</Link></li>
                <li><Link href="#" className="text-muted-foreground hover:text-primary">Careers</Link></li>
                <li><Link href="#" className="text-muted-foreground hover:text-primary">Press</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold">Support</h3>
              <ul className="mt-4 space-y-2 text-sm">
                <li><Link href="#" className="text-muted-foreground hover:text-primary">Contact Us</Link></li>
                <li><Link href="#" className="text-muted-foreground hover:text-primary">FAQ</Link></li>
                <li><Link href="#" className="text-muted-foreground hover:text-primary">Shipping & Returns</Link></li>
              </ul>
            </div>
            <div>
                <Button asChild variant="outline">
                    <Link href="/login">
                        <Shield className="mr-2 h-4 w-4" /> Admin Panel
                    </Link>
                </Button>
            </div>
          </div>
        </div>
        <div className="mt-8 border-t pt-8 text-center text-sm text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} RetailSpark. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
