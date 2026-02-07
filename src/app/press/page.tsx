
"use client";

import { useLanguage } from '@/context/LanguageContext';
import { PageHeader } from '@/components/PageHeader';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import Image from 'next/image';

const pressMentions = [
    { source: "TechCrunch", title: "RetailSpark raises $20M to revolutionize eCommerce with AI", date: "Oct 2024", logo: "/techcrunch-logo.svg" },
    { source: "Wired", title: "The Future of Shopping is Personalized, and RetailSpark is leading the way", date: "Sep 2024", logo: "/wired-logo.svg" },
    { source: "Forbes", title: "How this startup is using AI to compete with Amazon", date: "Aug 2024", logo: "/forbes-logo.svg" },
];

export default function PressPage() {
  const { t } = useLanguage();

  return (
    <div className="animate-card-enter">
      <PageHeader
        title={t('pressTitle')}
        subtitle={t('pressSubtitle')}
      />
      <main className="container mx-auto px-4 py-12">
        <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
                {pressMentions.map((mention, i) => (
                     <Card key={i} className="hover-lift card-glass">
                        <CardHeader>
                            <CardTitle>{mention.title}</CardTitle>
                            <CardDescription>{mention.source} - {mention.date}</CardDescription>
                        </CardHeader>
                    </Card>
                ))}
            </div>
             <aside className="space-y-6">
                <Card className="card-glass text-center p-6">
                    <h3 className="text-lg font-semibold mb-4">Press Kit</h3>
                    <p className="text-muted-foreground mb-4">Download our official press kit including logos, brand guidelines, and high-resolution images.</p>
                    <Button className="w-full">
                        <Download className="mr-2 h-4 w-4" /> Download Press Kit
                    </Button>
                </Card>
            </aside>
        </div>
      </main>
    </div>
  );
}
