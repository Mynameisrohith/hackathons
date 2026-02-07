
"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Boxes, LayoutDashboard, ShoppingCart, MessageSquareQuote, LogOut, User as UserIcon, Shield, Home } from "lucide-react";
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
import { useUser, useAuth, useFirestore } from "@/firebase";
import { useEffect } from "react";
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
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
import { useAdmin } from "@/hooks/useAdmin";

const menuItems = [
  { href: "/admin/analytics", label: "Analytics", icon: LayoutDashboard },
  { href: "/admin/products", label: "Products", icon: Boxes },
  { href: "/admin/sales", label: "Sales", icon: ShoppingCart },
  { href: "/admin/reviews", label: "Reviews", icon: MessageSquareQuote },
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
                <DropdownMenuItem asChild>
                    <Link href="/admin/profile">
                        <UserIcon className="mr-2 h-4 w-4" />
                        <span>Profile</span>
                    </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => auth.signOut()}>
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, isUserLoading } = useUser();
  const { isAdmin, isLoading: isAdminLoading } = useAdmin();
  const router = useRouter();
  const firestore = useFirestore();

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.replace('/login');
    }
  }, [user, isUserLoading, router]);

  useEffect(() => {
    if (user && firestore) {
      const userDocRef = doc(firestore, "users", user.uid);
      const checkAndCreateProfile = async () => {
        const docSnap = await getDoc(userDocRef);
        if (!docSnap.exists()) {
          try {
            await setDoc(userDocRef, {
              id: user.uid,
              displayName: user.displayName || "New User",
              email: user.email,
              photoURL: user.photoURL || "",
              creationTime: serverTimestamp(),
            });
          } catch (error) {
            console.error("Error creating user profile:", error);
          }
        }
      };
      checkAndCreateProfile();
    }
  }, [user, firestore]);

  const getPageTitle = () => {
    const allItems = [...menuItems];
    if (isAdmin) {
      allItems.push({ href: "/admin/categories", label: "Categories", icon: Shield });
    }
    if (pathname === '/admin/profile') {
        return "Profile";
    }
    return allItems.find(item => item.href === pathname)?.label || "Admin";
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
            <Link href="/admin/analytics" className="flex items-center gap-2">
              <RetailSparkIcon className="size-8 text-primary" />
              <h1 className="text-xl font-semibold text-primary">RetailSpark</h1>
            </Link>
          </SidebarHeader>
          <SidebarContent>
            <SidebarMenu>
               <SidebarMenuItem>
                  <SidebarMenuButton
                    asChild
                    tooltip={{ children: "Marketplace Home", side: "right", align:"center" }}
                  >
                    <Link href="/">
                      <Home />
                      <span>Home</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>

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
              {!isAdminLoading && isAdmin && (
                <SidebarMenuItem>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname === "/admin/categories"}
                    tooltip={{ children: "Categories", side: "right", align:"center" }}
                  >
                    <Link href="/admin/categories">
                      <Shield />
                      <span>Categories</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}
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
