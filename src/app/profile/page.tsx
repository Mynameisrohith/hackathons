'use client';

import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAuth, useUser, useFirestore } from '@/firebase';
import { updateProfile } from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { useRouter } from 'next/navigation';

import { PageHeader } from '@/components/PageHeader';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';

const profileFormSchema = z.object({
  displayName: z.string().min(2, { message: 'Name must be at least 2 characters.' }),
  email: z.string().email(),
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;

export default function ProfilePage() {
  const { t } = useLanguage();
  const auth = useAuth();
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      displayName: '',
      email: '',
    },
  });

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.replace('/login?redirect=/profile');
    }
    if (user) {
      form.reset({
        displayName: user.displayName || '',
        email: user.email || '',
      });
    }
  }, [user, isUserLoading, router, form]);

  const onSubmit = async (data: ProfileFormValues) => {
    if (!user || !auth.currentUser || !firestore) return;
    setIsSaving(true);
    try {
      // Update Firebase Auth profile
      await updateProfile(auth.currentUser, {
        displayName: data.displayName,
      });

      // Update Firestore user document
      const userDocRef = doc(firestore, 'users', user.uid);
      await setDoc(userDocRef, {
        displayName: data.displayName,
        updatedAt: serverTimestamp(),
      }, { merge: true });

      toast({
        title: 'Profile Updated',
        description: 'Your details have been successfully updated.',
      });
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        variant: 'destructive',
        title: 'Update Failed',
        description: 'There was a problem updating your profile. Please try again.',
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isUserLoading || !user) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin" />
      </div>
    );
  }

  return (
    <>
      <PageHeader title={t('profileTitle')} subtitle="Manage your account details." />
      <main className="container mx-auto px-4 py-12">
        <Card className="max-w-2xl mx-auto card-glass">
          <CardHeader>
            <CardTitle>Edit Profile</CardTitle>
            <CardDescription>Make changes to your profile here. Click save when you're done.</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="displayName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('displayName')}</FormLabel>
                      <FormControl>
                        <Input placeholder="Your Name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('email')}</FormLabel>
                      <FormControl>
                        <Input placeholder="your.email@example.com" {...field} disabled />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" disabled={isSaving}>
                  {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {t('saveChanges')}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </main>
    </>
  );
}
