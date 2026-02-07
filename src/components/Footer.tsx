"use client";

import Link from "next/link";
import { RetailSparkIcon } from "@/components/icons";
import { Button } from "./ui/button";
import { Shield } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";

export function Footer() {
  const { t } = useLanguage();
  return (
    <footer className="border-t bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
          <div className="md:col-span-1">
            <Link href="/" className="flex items-center gap-2">
              <RetailSparkIcon className="size-8 text-primary" />
              <span className="text-xl font-semibold text-primary">
                RetailSpark
              </span>
            </Link>
            <p className="mt-4 text-sm text-muted-foreground">{t("tagline")}</p>
          </div>
          <div className="grid grid-cols-2 gap-8 md:col-span-3 md:grid-cols-4">
            <div>
              <h3 className="font-semibold">{t("shop")}</h3>
              <ul className="mt-4 space-y-2 text-sm">
                <li>
                  <Link
                    href="/products"
                    className="text-muted-foreground hover:text-primary"
                  >
                    {t("allProducts")}
                  </Link>
                </li>
                <li>
                  <Link
                    href="/categories"
                    className="text-muted-foreground hover:text-primary"
                  >
                    {t("categories")}
                  </Link>
                </li>
                <li>
                  <Link
                    href="/new-arrivals"
                    className="text-muted-foreground hover:text-primary"
                  >
                    {t("newArrivals")}
                  </Link>
                </li>
                <li>
                  <Link
                    href="/deals"
                    className="text-muted-foreground hover:text-primary"
                  >
                    {t("deals")}
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold">{t("company")}</h3>
              <ul className="mt-4 space-y-2 text-sm">
                <li>
                  <Link
                    href="/about"
                    className="text-muted-foreground hover:text-primary"
                  >
                    {t("aboutUs")}
                  </Link>
                </li>
                <li>
                  <Link
                    href="/careers"
                    className="text-muted-foreground hover:text-primary"
                  >
                    {t("careers")}
                  </Link>
                </li>
                <li>
                  <Link
                    href="/press"
                    className="text-muted-foreground hover:text-primary"
                  >
                    {t("press")}
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold">{t("support")}</h3>
              <ul className="mt-4 space-y-2 text-sm">
                <li>
                  <Link
                    href="/contact"
                    className="text-muted-foreground hover:text-primary"
                  >
                    {t("contactUs")}
                  </Link>
                </li>
                <li>
                  <Link
                    href="/faq"
                    className="text-muted-foreground hover:text-primary"
                  >
                    {t("faq")}
                  </Link>
                </li>
                <li>
                  <Link
                    href="/shipping-returns"
                    className="text-muted-foreground hover:text-primary"
                  >
                    {t("shippingReturns")}
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <Button asChild variant="outline">
                <Link href="/login">
                  <Shield className="mr-2 h-4 w-4" /> Portals
                </Link>
              </Button>
            </div>
          </div>
        </div>
        <div className="mt-8 border-t pt-8 text-center text-sm text-muted-foreground">
          <p>
            {t("copyright").replace("{year}", new Date().getFullYear().toString())}
          </p>
        </div>
      </div>
    </footer>
  );
}
