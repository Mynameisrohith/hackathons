
"use client";

import { useLanguage } from '@/context/LanguageContext';
import { PageHeader } from '@/components/PageHeader';
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Target, Eye } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

const teamMembers = [
  { name: "Alex Doe", role: "CEO & Founder", image: "https://i.pravatar.cc/150?img=1" },
  { name: "Jane Smith", role: "CTO", image: "https://i.pravatar.cc/150?img=2" },
  { name: "Sam Wilson", role: "Head of Design", image: "https://i.pravatar.cc/150?img=3" },
  { name: "Maria Garcia", role: "Lead Engineer", image: "https://i.pravatar.cc/150?img=4" },
];

export default function AboutPage() {
  const { t } = useLanguage();

  return (
    <div className="animate-card-enter">
      <PageHeader
        title={t('aboutUsTitle')}
        subtitle={t('aboutUsSubtitle')}
      />
      <main className="container mx-auto px-4 py-12 space-y-24">
        {/* Brand Story */}
        <section className="grid md:grid-cols-2 gap-12 items-center">
            <div className="relative h-96 rounded-xl overflow-hidden">
                 <Image src="https://picsum.photos/seed/about/800/600" alt="Our Team" layout="fill" objectFit="cover" />
            </div>
            <div>
                <h2 className="text-3xl font-bold mb-4">The RetailSpark Journey</h2>
                <p className="text-muted-foreground leading-relaxed">
                    Founded in 2023, RetailSpark began with a simple idea: to create a smarter, more personalized online shopping experience. Frustrated with generic marketplaces, our founders envisioned a platform where technology and human curation intersect. Using cutting-edge AI, we connect shoppers with products they'll love, while empowering independent sellers to reach a global audience. Our journey is one of innovation, passion, and a relentless commitment to redefining retail.
                </p>
            </div>
        </section>

        {/* Mission & Vision */}
        <section className="grid md:grid-cols-2 gap-8">
            <Card className="card-glass hover-lift">
                <CardHeader className="flex-row items-center gap-4">
                    <Target className="w-8 h-8 text-primary"/>
                    <CardTitle>{t('ourMission')}</CardTitle>
                </CardHeader>
                <CardContent>
                    To empower sellers and delight buyers by creating the world's most intelligent and intuitive marketplace.
                </CardContent>
            </Card>
            <Card className="card-glass hover-lift">
                <CardHeader className="flex-row items-center gap-4">
                    <Eye className="w-8 h-8 text-primary"/>
                    <CardTitle>{t('ourVision')}</CardTitle>
                </CardHeader>
                <CardContent>
                    To be the definitive platform for discovering unique products, powered by AI and a vibrant community.
                </CardContent>
            </Card>
        </section>

        {/* Team Section */}
        <section>
            <h2 className="text-3xl font-bold text-center mb-10">{t('meetTheTeam')}</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                {teamMembers.map((member, i) => (
                    <div key={member.name} className="text-center animate-card-enter" style={{animationDelay: `${i*100}ms`}}>
                        <Avatar className="w-32 h-32 mx-auto mb-4 ring-2 ring-primary/50">
                            <AvatarImage src={member.image} alt={member.name} />
                            <AvatarFallback>{member.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <h3 className="font-semibold">{member.name}</h3>
                        <p className="text-sm text-muted-foreground">{member.role}</p>
                    </div>
                ))}
            </div>
        </section>

      </main>
    </div>
  );
}
