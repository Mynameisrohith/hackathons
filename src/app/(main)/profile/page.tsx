
'use client';

import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { doc, updateDoc } from 'firebase/firestore';
import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { useAdmin } from '@/hooks/useAdmin';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { toast } from '@/hooks/use-toast';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { UserProfile } from '@/lib/types';
import { User as UserIcon } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const profileSchema = z.object({
  displayName: z.string().min(2, { message: "Display name must be at least 2 characters." }),
});

export default function ProfilePage() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const { isAdmin, isLoading: isAdminLoading } = useAdmin();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const userDocRef = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return doc(firestore, 'users', user.uid);
  }, [user, firestore]);

  const { data: userProfile, isLoading: isProfileLoading } = useDoc<UserProfile>(userDocRef);

  const form = useForm<z.infer<typeof profileSchema>>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      displayName: '',
    },
  });

  useEffect(() => {
    if (userProfile) {
      form.reset({ displayName: userProfile.displayName });
    }
  }, [userProfile, form]);

  const onSubmit = async (values: z.infer<typeof profileSchema>) => {
    if (!userDocRef) {
        toast({ variant: 'destructive', title: 'Error', description: 'User not found.' });
        return;
    }
    setIsSubmitting(true);
    try {
        await updateDoc(userDocRef, { displayName: values.displayName });
        toast({ title: 'Success', description: 'Profile updated successfully.' });
    } catch(e: any) {
        console.error("Error updating profile:", e);
        toast({ variant: 'destructive', title: 'Error', description: e.message || 'Failed to update profile.' });
    } finally {
        setIsSubmitting(false);
    }
  };

  const isLoading = isUserLoading || isProfileLoading || isAdminLoading;

  if (isLoading) {
    return (
      <div className="flex justify-center">
        <Card className="w-full max-w-2xl">
          <CardHeader className="flex flex-col items-center text-center">
            <Skeleton className="h-24 w-24 rounded-full" />
            <Skeleton className="h-6 w-48 mt-4" />
            <Skeleton className="h-4 w-56 mt-2" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
                <Skeleton className="h-5 w-24" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-5 w-24" />
                <Skeleton className="h-10 w-full" />
            </div>
          </CardContent>
          <CardFooter>
            <Skeleton className="h-10 w-24" />
          </CardFooter>
        </Card>
      </div>
    );
  }

  if (!userProfile) {
    return <p>User profile not found.</p>;
  }

  return (
    <div className="flex justify-center animate-card-enter">
      <Card className="w-full max-w-2xl card-glass">
        <CardHeader className="items-center text-center">
            <Avatar className="h-24 w-24 mb-4">
                <AvatarImage src={userProfile.photoURL || ''} alt={userProfile.displayName || ''} />
                <AvatarFallback className="text-3xl">
                    {userProfile.displayName ? userProfile.displayName.charAt(0).toUpperCase() : <UserIcon />}
                </AvatarFallback>
            </Avatar>
          <CardTitle className="text-3xl">{userProfile.displayName}</CardTitle>
          <CardDescription className='flex flex-col items-center gap-2'>
            <span>{userProfile.email}</span>
            <Badge variant={isAdmin ? "destructive" : "secondary"}>{isAdmin ? "Admin" : "User"}</Badge>
          </CardDescription>
        </CardHeader>
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
                <CardContent className="space-y-6">
                <FormField
                    control={form.control}
                    name="displayName"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel>Display Name</FormLabel>
                        <FormControl>
                        <Input placeholder="Your display name" {...field} />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                    )}
                />
                <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                    <Input type="email" value={userProfile.email} disabled />
                    </FormControl>
                </FormItem>
                </CardContent>
                <CardFooter>
                <Button type="submit" disabled={isSubmitting || !form.formState.isDirty}>
                    {isSubmitting ? 'Saving...' : 'Save Changes'}
                </Button>
                </CardFooter>
            </form>
        </Form>
      </Card>
    </div>
  );
}
