
"use client";

import Link from "next/link";
import { RetailSparkIcon } from "@/components/icons";
import { Button } from "./ui/button";
import { Shield } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";

const footerSections = [
  {
    title: 'Get to Know Us',
    links: [
      { label: 'About Us', href: '/about' },
      { label: 'Careers', href: '/careers' },
      { label: 'Press Releases', href: '/press' },
      { label: 'RetailSpark Science', href: '#' },
    ]
  },
  {
    title: 'Connect with Us',
    links: [
      { label: 'Facebook', href: '#' },
      { label: 'Twitter', href: '#' },
      { label: 'Instagram', href: '#' },
    ]
  },
  {
    title: 'Make Money with Us',
    links: [
      { label: 'Sell on RetailSpark', href: '/auth/signup' },
      { label: 'Sell under RetailSpark Accelerator', href: '#' },
      { label: 'Become an Affiliate', href: '#' },
      { label: 'Fulfilled by RetailSpark', href: '#' },
      { label: 'Advertise Your Products', href: '#' },
    ]
  },
  {
    title: 'Let Us Help You',
    links: [
      { label: 'COVID-19 and RetailSpark', href: '#' },
      { label: 'Your Account', href: '/profile' },
      { label: 'Returns Centre', href: '/shipping-returns' },
      { label: '100% Purchase Protection', href: '#' },
      { label: 'Help', href: '/faq' },
    ]
  }
];

export function Footer() {
  const { t } = useLanguage();
  return (
    <footer className="border-t bg-gray-100 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
          {footerSections.map(section => (
            <div key={section.title}>
              <h3 className="font-semibold text-gray-800 dark:text-white">{section.title}</h3>
              <ul className="mt-4 space-y-2 text-sm">
                {section.links.map(link => (
                  <li key={link.label}>
                    <Link href={link.href} className="text-muted-foreground hover:text-primary hover:underline">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-12 border-t pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-2">
            <RetailSparkIcon className="size-8 text-primary" />
            <span className="text-xl font-semibold text-gray-800 dark:text-white">
              RetailSpark
            </span>
          </Link>
          <p className="text-center text-sm text-muted-foreground">
            {t("copyright").replace("{year}", new Date().getFullYear().toString())}
          </p>
          <Button asChild variant="outline">
            <Link href="/login">
              <Shield className="mr-2 h-4 w-4" /> Portals
            </Link>
          </Button>
        </div>
      </div>
    </footer>
  );
}
