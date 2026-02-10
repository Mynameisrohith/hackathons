
"use client";

import Link from "next/link";
import { RetailSparkIcon } from "@/components/icons";
import { Button } from "./ui/button";
import { Shield } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";

const footerSections = {
  marketplace: [
    { label: "About Us", href: "/about" },
    { label: "Products", href: "/products" },
    { label: "Deals", href: "/deals" },
    { label: "New Arrivals", href: "/new-arrivals" },
  ],
  support: [
    { label: "Contact Us", href: "/contact" },
    { label: "FAQ", href: "/faq" },
    { label: "Shipping & Returns", href: "/shipping-returns" },
    { label: "Your Account", href: "/profile" },
  ],
  portals: [
    { label: "Sell on RetailSpark", href: "/auth/signup" },
    { label: "Dealer Portal", href: "/dealer/dashboard" },
    { label: "Admin Control Center", href: "/admin/dashboard" },
    { label: "Delivery Partner", href: "/delivery/dashboard" },
  ],
  company: [
    { label: "Careers", href: "/careers" },
    { label: "Press", href: "/press" },
    { label: "Facebook", href: "#" },
    { label: "Twitter", href: "#" },
  ],
};

export function Footer() {
  const { t } = useLanguage();
  return (
    <footer className="border-t border-border/50 bg-background/50 backdrop-blur-lg">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
          <div>
            <h3 className="font-semibold text-foreground">Marketplace</h3>
            <ul className="mt-4 space-y-2 text-sm">
              {footerSections.marketplace.map(link => (
                <li key={link.label}>
                  <Link href={link.href} className="text-muted-foreground hover:text-primary hover:underline">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="font-semibold text-foreground">Support</h3>
            <ul className="mt-4 space-y-2 text-sm">
              {footerSections.support.map(link => (
                <li key={link.label}>
                  <Link href={link.href} className="text-muted-foreground hover:text-primary hover:underline">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="font-semibold text-foreground">Portals</h3>
            <ul className="mt-4 space-y-2 text-sm">
              {footerSections.portals.map(link => (
                <li key={link.label}>
                  <Link href={link.href} className="text-muted-foreground hover:text-primary hover:underline">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="font-semibold text-foreground">Company</h3>
            <ul className="mt-4 space-y-2 text-sm">
              {footerSections.company.map(link => (
                <li key={link.label}>
                  <Link href={link.href} className="text-muted-foreground hover:text-primary hover:underline">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
        <div className="mt-12 border-t border-border/50 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-2">
            <RetailSparkIcon className="size-8 text-primary" />
            <span className="text-xl font-semibold text-foreground">
              RetailSpark
            </span>
          </Link>
          <p className="text-center text-sm text-muted-foreground">
            {t("copyright").replace("{year}", new Date().getFullYear().toString())}
          </p>
        </div>
      </div>
    </footer>
  );
}
