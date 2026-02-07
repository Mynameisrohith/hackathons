
"use client";

import { useLanguage } from '@/context/LanguageContext';
import { PageHeader } from '@/components/PageHeader';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const openPositions = [
    { title: "Senior Frontend Engineer", location: "Remote", type: "Full-time" },
    { title: "AI/ML Specialist", location: "Bangalore, IN", type: "Full-time" },
    { title: "Product Designer (UX/UI)", location: "Remote", type: "Contract" },
    { title: "Head of Marketing", location: "Hybrid", type: "Full-time" },
];

export default function CareersPage() {
  const { t } = useLanguage();

  return (
    <div className="animate-card-enter">
      <PageHeader
        title={t('careersTitle')}
        subtitle={t('careersSubtitle')}
      />
      <main className="container mx-auto px-4 py-12">
        <h2 className="text-3xl font-bold text-center mb-10">{t('openPositions')}</h2>
        <div className="max-w-4xl mx-auto space-y-6">
            {openPositions.map((job, i) => (
                 <Card key={i} className="hover-lift card-glass">
                    <CardHeader>
                        <CardTitle className="flex justify-between items-start">
                            <span>{job.title}</span>
                             <div className="flex gap-2">
                                <Badge variant="secondary">{job.location}</Badge>
                                <Badge variant="outline">{job.type}</Badge>
                            </div>
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <CardDescription>
                            We are looking for a passionate and skilled individual to join our growing team. If you are a self-starter and love to build amazing products, this is the role for you.
                        </CardDescription>
                    </CardContent>
                    <CardFooter>
                        <Button>
                            {t('applyNow')} <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                    </CardFooter>
                </Card>
            ))}
        </div>
      </main>
    </div>
  );
}
