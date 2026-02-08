'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { RetailSparkIcon } from '@/components/icons';
import { Button } from '@/components/ui/button';
import {
  LayoutDashboard,
  Package,
  Map,
  Store,
  ShieldAlert,
  BarChart2,
  Users,
  MessageSquare,
  Warehouse,
  ShoppingBag,
  List,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/context/LanguageContext';
import type { TranslationKeys } from '@/lib/translations';

const navItems = [
  { href: '/admin/dashboard', icon: LayoutDashboard, label: 'dashboard' },
  { href: '/admin/orders', icon: Package, label: 'orders' },
  { href: '/admin/products', icon: ShoppingBag, label: 'Products' },
  { href: '/admin/categories', icon: List, label: 'Categories' },
  { href: '/admin/inventory', icon: Warehouse, label: 'Inventory' },
  { href: '/admin/live-tracking', icon: Map, label: 'liveTracking' },
  { href: '/admin/dealers', icon: Store, label: 'dealers' },
  { href: '/admin/fraud', icon: ShieldAlert, label: 'fraudMonitoring' },
  { href: '/admin/analytics', icon: BarChart2, label: 'analytics' },
  { href: '/admin/customers', icon: Users, label: 'customers' },
  { href: '/admin/feedback', icon: MessageSquare, label: 'feedbackCenter' },
];

const NavItem = ({ item }: { item: typeof navItems[0] }) => {
  const { t } = useLanguage();
  const pathname = usePathname();
  const isActive = pathname.startsWith(item.href);

  return (
    <Link href={item.href} passHref>
      <Button
        variant={isActive ? 'secondary' : 'ghost'}
        className="w-full justify-start"
      >
        <item.icon className="mr-2 h-4 w-4" />
        {t(item.label as TranslationKeys) || item.label}
      </Button>
    </Link>
  );
};

export default function AdminSidebar() {
  return (
    <aside className="hidden md:flex flex-col w-64 bg-background border-r">
      <div className="p-4 border-b flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
            <RetailSparkIcon className="size-8 text-primary" />
            <span className="text-xl font-semibold">RetailSpark</span>
        </Link>
      </div>
      <nav className="flex-1 p-2 space-y-1">
        {navItems.map(item => (
          <NavItem key={item.href} item={item} />
        ))}
      </nav>
    </aside>
  );
}
