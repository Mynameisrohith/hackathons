"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Boxes, LayoutDashboard, ShoppingCart, MessageSquareQuote, LogOut, User as UserIcon } from "lucide-react";
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarTrigger,
  SidebarInset,
} from "@/components/ui/sidebar";
import { RetailSparkIcon } from "@/components/icons";
import { cn } from "@/lib/utils";
import { useUser, useAuth } from "@/firebase";
import { useEffect } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

const menuItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/products", label: "Products", icon: Boxes },
  { href: "/sales", label: "Sales", icon: ShoppingCart },
  { href: "/reviews", label: "Reviews", icon: MessageSquareQuote },
];

function UserNav() {
    const { user } = useUser();
    const auth = useAuth();

    if (!user) {
        return <Skeleton className="h-8 w-8 rounded-full" />;
    }

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                    <Avatar className="h-8 w-8">
                        <AvatarImage src={user.photoURL || ''} alt={user.displayName || ''} />
                        <AvatarFallback>
                            {user.displayName ? user.displayName.charAt(0).toUpperCase() : <UserIcon />}
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
                <DropdownMenuItem onClick={() => auth.signOut()}>
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, isUserLoading } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.replace('/login');
    }
  }, [user, isUserLoading, router]);

  const getPageTitle = () => {
    return menuItems.find(item => item.href === pathname)?.label || "Dashboard";
  }

  if (isUserLoading || !user) {
    return (
      <div className="flex h-screen items-center justify-center">
        <RetailSparkIcon className="size-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <SidebarProvider>
      <div className="flex min-h-screen">
        <Sidebar
          variant="sidebar"
          collapsible="icon"
          className="hidden border-r bg-sidebar md:flex"
        >
          <SidebarHeader className="border-b">
            <Link href="/" className="flex items-center gap-2">
              <RetailSparkIcon className="size-8 text-primary" />
              <h1 className="text-xl font-semibold text-primary">RetailSpark</h1>
            </Link>
          </SidebarHeader>
          <SidebarContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname === item.href}
                    tooltip={{ children: item.label, side: "right", align:"center" }}
                  >
                    <Link href={item.href}>
                      <item.icon />
                      <span>{item.label}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarContent>
        </Sidebar>
        <SidebarInset>
          <header className="flex h-14 items-center gap-4 border-b bg-card px-4 lg:h-[60px] lg:px-6">
            <SidebarTrigger className="md:hidden" />
            <h1 className="text-lg font-semibold">{getPageTitle()}</h1>
            <div className="ml-auto">
                <UserNav />
            </div>
          </header>
          <main className="flex-1 p-4 sm:p-6 bg-background/80">
            {children}
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
