
"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, limit } from 'firebase/firestore';
import { useFirestore } from '@/firebase';
import { Product, Category } from '@/lib/types';
import { ProductCard } from '@/components/ProductCard';
import { CategoryCard } from '@/components/CategoryCard';
import { Button } from '@/components/ui/button';
import { ArrowRight, ShoppingBag, Star } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useLanguage } from '@/context/LanguageContext';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import Autoplay from "embla-carousel-autoplay";

const heroSlides = [
  {
    image: 'https://picsum.photos/seed/sale1/1600/600',
    title: 'Republic Day Super Sale',
    subtitle: 'Up to 70% off on Electronics, Fashion & More!',
    imageHint: "sale event"
  },
  {
    image: 'https://picsum.photos/seed/sale2/1600/600',
    title: 'AI-Powered Gadgets Launch',
    subtitle: 'Discover the Future of Technology Today.',
    imageHint: "gadgets tech"
  },
  {
    image: 'https://picsum.photos/seed/sale3/1600/600',
    title: 'Home & Kitchen Essentials',
    subtitle: 'Deals you cannot miss on top brands.',
    imageHint: "kitchenware appliance"
  },
];

const flashDeals = [
  { id: '1', name: 'Smart AI Assistant', price: 49.99, originalPrice: 99.99, stockSold: 75, image: 'https://picsum.photos/seed/flash1/400/400', imageHint: "smart speaker" },
  { id: '2', name: 'High-Performance Drone', price: 299.99, originalPrice: 499.99, stockSold: 50, image: 'https://picsum.photos/seed/flash2/400/400', imageHint: "drone camera" },
  { id: '3', name: 'VR Headset Pro', price: 399.00, originalPrice: 599.00, stockSold: 82, image: 'https://picsum.photos/seed/flash3/400/400', imageHint: "vr headset" },
  { id: '4', name: 'Wireless Noise-Cancelling Headphones', price: 149.50, originalPrice: 249.00, stockSold: 60, image: 'https://picsum.photos/seed/flash4/400/400', imageHint: "headphones audio" },
  { id: '5', name: '4K Action Camera', price: 99.99, originalPrice: 179.99, stockSold: 91, image: 'https://picsum.photos/seed/flash5/400/400', imageHint: "action camera" },
];

const testimonials = [
  { name: 'Rohan Sharma', text: "Incredible platform! The AI recommendations are spot on. Found exactly what I needed in minutes.", rating: 5, image: 'https://i.pravatar.cc/150?img=5' },
  { name: 'Priya Singh', text: "The flash deals are amazing value. The delivery was super fast too. Highly recommended!", rating: 5, image: 'https://i.pravatar.cc/150?img=6' },
  { name: 'Ankit Patel', text: "As a seller, the platform has been a game-changer for my business. The dealer dashboard is powerful and easy to use.", rating: 4, image: 'https://i.pravatar.cc/150?img=7' },
];

function CountdownTimer({ saleEndDate }: { saleEndDate: string }) {
    const calculateTimeLeft = () => {
        const difference = +new Date(saleEndDate) - +new Date();
        let timeLeft = { days: 0, hours: 0, minutes: 0, seconds: 0 };
        if (difference > 0) {
            timeLeft = {
                days: Math.floor(difference / (1000 * 60 * 60 * 24)),
                hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
                minutes: Math.floor((difference / 1000 / 60) % 60),
                seconds: Math.floor((difference / 1000) % 60)
            };
        }
        return timeLeft;
    };
    const [timeLeft, setTimeLeft] = useState(calculateTimeLeft());
    useEffect(() => {
        const timer = setInterval(() => setTimeLeft(calculateTimeLeft()), 1000);
        return () => clearInterval(timer);
    }, [saleEndDate]);
    return (
        <div className="flex justify-center gap-2 md:gap-4 my-4">
            {Object.entries(timeLeft).map(([unit, value]) => (
                <div key={unit} className="p-2 bg-white/20 rounded-lg text-center w-20 backdrop-blur-sm">
                    <div className="text-2xl md:text-4xl font-bold">{String(value).padStart(2, '0')}</div>
                    <div className="text-xs uppercase">{unit}</div>
                </div>
            ))}
        </div>
    );
}

function MegaBanner() {
  const saleEndDate = new Date();
  saleEndDate.setDate(saleEndDate.getDate() + 3); // 3 days from now
  return (
    <section>
      <Carousel
        plugins={[Autoplay({ delay: 5000 })]}
        opts={{ loop: true }}
        className="w-full"
      >
        <CarouselContent>
          {heroSlides.map((slide, index) => (
            <CarouselItem key={index}>
              <div className="relative h-[400px] md:h-[500px] w-full">
                <Image src={slide.image} alt={slide.title} fill objectFit="cover" data-ai-hint={slide.imageHint}/>
                <div className="absolute inset-0 bg-black/40" />
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center text-white p-4">
                  <h1 className="text-3xl md:text-5xl lg:text-6xl font-extrabold tracking-tight">{slide.title}</h1>
                  <p className="mt-4 max-w-2xl text-lg">{slide.subtitle}</p>
                  <CountdownTimer saleEndDate={saleEndDate.toISOString()} />
                  <div className="mt-4 flex gap-4">
                    <Button size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90">Shop Now</Button>
                    <Button size="lg" variant="outline" className="bg-transparent text-white border-white hover:bg-white hover:text-black">Explore Deals</Button>
                  </div>
                </div>
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious className="absolute left-4 top-1/2 -translate-y-1/2 text-white bg-black/30 hover:bg-black/50 border-none" />
        <CarouselNext className="absolute right-4 top-1/2 -translate-y-1/2 text-white bg-black/30 hover:bg-black/50 border-none" />
      </Carousel>
    </section>
  );
}

function DealGrid({ products, isLoading }: { products: Product[] | null, isLoading: boolean }) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-64 w-full" />)}
      </div>
    );
  }
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {products?.map(product => (
        <Link href={`/product/${product.id}`} key={product.id} className="bg-white p-4 rounded-md shadow-sm hover:shadow-lg transition-shadow border">
          <div className="relative aspect-square mb-4">
            <Image src={product.imageUrl} alt={product.name} fill objectFit="contain" />
          </div>
          <h3 className="text-sm font-medium truncate">{product.name}</h3>
          <div>
            <span className="bg-red-600 text-white text-xs font-bold px-2 py-0.5 rounded-sm">Up to 50% off</span>
            <span className="text-red-600 font-semibold ml-2">Deal of the Day</span>
          </div>
        </Link>
      ))}
    </div>
  );
}

function CategoryExplorer({ categories, isLoading }: { categories: Category[] | null, isLoading: boolean }) {
  if (isLoading) {
    return (
      <div className="flex gap-4 overflow-x-auto pb-4">
        {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-32 w-32 rounded-md shrink-0" />)}
      </div>
    );
  }
  return (
    <div className="flex gap-4 overflow-x-auto pb-4">
      {categories?.map(category => (
        <Link href={`/category/${category.id}`} key={category.id} className="flex flex-col items-center gap-2 shrink-0 w-32">
          <div className="relative h-24 w-24 rounded-full overflow-hidden border-2 border-transparent group-hover:border-accent">
            <Image src={category.imageUrl} alt={category.name} fill objectFit="cover" />
          </div>
          <span className="text-sm font-medium text-center">{category.name}</span>
        </Link>
      ))}
    </div>
  );
}

function FlashDeals() {
    return (
        <Card className="bg-white">
            <CardHeader>
                <CardTitle>Flash Deals</CardTitle>
            </CardHeader>
            <CardContent>
                <Carousel opts={{ align: "start" }}>
                    <CarouselContent>
                        {flashDeals.map((deal) => (
                            <CarouselItem key={deal.id} className="basis-1/2 md:basis-1/3 lg:basis-1/4">
                                <Link href="#" className="block p-1">
                                    <div className="relative aspect-square mb-2">
                                        <Image src={deal.image} alt={deal.name} fill objectFit="cover" className="rounded-md" data-ai-hint={deal.imageHint} />
                                    </div>
                                    <p className="text-sm font-semibold">${deal.price}</p>
                                    <p className="text-xs text-muted-foreground line-through">${deal.originalPrice}</p>
                                    <Progress value={deal.stockSold} className="h-1.5 mt-2" />
                                    <p className="text-xs text-muted-foreground mt-1">{deal.stockSold}% sold</p>
                                </Link>
                            </CarouselItem>
                        ))}
                    </CarouselContent>
                    <CarouselPrevious className="ml-12" />
                    <CarouselNext className="mr-12" />
                </Carousel>
            </CardContent>
        </Card>
    );
}

function Testimonials() {
    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials.map((testimonial, i) => (
                <Card key={i} className="bg-white">
                    <CardContent className="p-6">
                        <div className="flex items-center gap-4 mb-4">
                            <Avatar>
                                <AvatarImage src={testimonial.image} />
                                <AvatarFallback>{testimonial.name.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <p className="font-semibold">{testimonial.name}</p>
                        </div>
                        <div className="flex items-center mb-2">
                            {[...Array(testimonial.rating)].map((_, j) => <Star key={j} className="h-5 w-5 fill-yellow-400 text-yellow-400" />)}
                        </div>
                        <p className="text-muted-foreground text-sm">"{testimonial.text}"</p>
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}


export default function HomePage() {
  const firestore = useFirestore();

  const productsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'products'), orderBy('createdAt', 'desc'), limit(4));
  }, [firestore]);

  const categoriesQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'categories'), orderBy('createdAt', 'desc'), limit(8));
  }, [firestore]);

  const { data: products, isLoading: isLoadingProducts } = useCollection<Product>(productsQuery);
  const { data: categories, isLoading: isLoadingCategories } = useCollection<Category>(categoriesQuery);

  return (
    <div className="bg-secondary/60">
      <MegaBanner />
      <main className="container mx-auto px-4 py-8 space-y-12">
        <DealGrid products={products} isLoading={isLoadingProducts} />
        <CategoryExplorer categories={categories} isLoading={isLoadingCategories} />
        <FlashDeals />
        <Testimonials />
      </main>
    </div>
  );
}
