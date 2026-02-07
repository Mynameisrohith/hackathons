
"use client";

import { useLanguage } from '@/context/LanguageContext';
import { PageHeader } from '@/components/PageHeader';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';

export default function ContactPage() {
  const { t } = useLanguage();

  return (
    <div className="animate-card-enter">
      <PageHeader
        title={t('contactTitle')}
        subtitle={t('contactSubtitle')}
      />
      <main className="container mx-auto px-4 py-12">
        <div className="grid lg:grid-cols-2 gap-12">
          <Card className="card-glass p-8">
            <form className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="name">{t('fullName')}</Label>
                <Input id="name" placeholder="John Doe" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">{t('email')}</Label>
                <Input id="email" type="email" placeholder="john@example.com" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="message">{t('message')}</Label>
                <Textarea id="message" placeholder="Your message..." rows={5} />
              </div>
              <Button type="submit" className="w-full gradient-btn">
                {t('submit')}
              </Button>
            </form>
          </Card>
          <div className="space-y-6">
             <div className="w-full aspect-video overflow-hidden rounded-xl border">
                <iframe
                    width="100%"
                    height="100%"
                    loading="lazy"
                    allowFullScreen
                    src={`https://www.google.com/maps/embed/v1/place?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&q=Bangalore,India`}>
                </iframe>
            </div>
            <Card className="card-glass">
                <CardContent className="p-6 text-sm">
                    <p><strong>Email:</strong> support@retailspark.com</p>
                    <p><strong>Phone:</strong> +91 123 456 7890</p>
                    <p><strong>Address:</strong> 123 Tech Park, Bangalore, India</p>
                </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
