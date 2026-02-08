'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useCollection, useMemoFirebase, useFirestore } from '@/firebase';
import { collection, query, addDoc, serverTimestamp, deleteDoc, doc } from 'firebase/firestore';
import type { Category } from '@/lib/types';
import { useLanguage } from '@/context/LanguageContext';

import { PageHeader } from '@/components/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from '@/hooks/use-toast';
import { Loader2, PlusCircle, Trash2 } from 'lucide-react';
import Image from 'next/image';

const categorySchema = z.object({
    name: z.string().min(2, 'Name is required'),
    description: z.string().min(10, 'Description is required'),
    imageUrl: z.string().url('A valid image URL is required'),
});

export default function CategoriesAdminPage() {
    const { t } = useLanguage();
    const firestore = useFirestore();
    const [isSubmitting, setIsSubmitting] = useState(false);

    const categoriesQuery = useMemoFirebase(() => firestore ? query(collection(firestore, 'categories')) : null, [firestore]);
    const { data: categories, isLoading } = useCollection<Category>(categoriesQuery);

    const form = useForm<z.infer<typeof categorySchema>>({
        resolver: zodResolver(categorySchema),
        defaultValues: { name: '', description: '', imageUrl: '' },
    });

    const onSubmit = async (values: z.infer<typeof categorySchema>) => {
        if (!firestore) return;
        setIsSubmitting(true);
        try {
            await addDoc(collection(firestore, 'categories'), {
                ...values,
                createdAt: serverTimestamp(),
            });
            toast({ title: 'Category Added' });
            form.reset();
        } catch (error) {
            toast({ variant: 'destructive', title: 'Error', description: 'Could not add category.' });
        } finally {
            setIsSubmitting(false);
        }
    };
    
    const handleDelete = async (id: string, name: string) => {
        if(!firestore) return;
        if(confirm(t('deleteCategoryWarning').replace('{name}', name))) {
            await deleteDoc(doc(firestore, 'categories', id));
            toast({title: 'Category Deleted'});
        }
    }

    return (
        <div className="animate-card-enter">
            <PageHeader title={t('productCategories')} subtitle={t('manageCategories')} />
            <main className="p-4 sm:p-6 lg:p-8 grid md:grid-cols-3 gap-8">
                <div className="md:col-span-1">
                    <Card className="card-glass">
                        <CardHeader><CardTitle>{t('addNewCategory')}</CardTitle></CardHeader>
                        <CardContent>
                            <Form {...form}>
                                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                                    <FormField name="name" control={form.control} render={({ field }) => (
                                        <FormItem><FormLabel>{t('categoryName')}</FormLabel><FormControl><Input placeholder={t('categoryNamePlaceholder')} {...field} /></FormControl><FormMessage /></FormItem>
                                    )} />
                                    <FormField name="description" control={form.control} render={({ field }) => (
                                        <FormItem><FormLabel>{t('description')}</FormLabel><FormControl><Textarea placeholder={t('categoryDescPlaceholder')} {...field} /></FormControl><FormMessage /></FormItem>
                                    )} />
                                    <FormField name="imageUrl" control={form.control} render={({ field }) => (
                                        <FormItem><FormLabel>{t('imageUrl')}</FormLabel><FormControl><Input placeholder="https://..." {...field} /></FormControl><FormMessage /></FormItem>
                                    )} />
                                    <Button type="submit" disabled={isSubmitting} className="w-full">
                                        {isSubmitting ? <Loader2 className="animate-spin mr-2" /> : <PlusCircle className="mr-2" />}
                                        {isSubmitting ? t('adding') : t('addCategory')}
                                    </Button>
                                </form>
                            </Form>
                        </CardContent>
                    </Card>
                </div>
                <div className="md:col-span-2">
                    <Card className="card-glass">
                        <CardHeader><CardTitle>{t('categories')}</CardTitle></CardHeader>
                        <CardContent>
                             {isLoading ? (
                                <div className="space-y-2">
                                    {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
                                </div>
                            ) : (
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>{t('category')}</TableHead>
                                            <TableHead>{t('description')}</TableHead>
                                            <TableHead className="text-right">{t('actions')}</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {categories?.length === 0 && (
                                            <TableRow><TableCell colSpan={3} className="h-24 text-center">{t('noCategoriesToAdd')}</TableCell></TableRow>
                                        )}
                                        {categories?.map(cat => (
                                            <TableRow key={cat.id}>
                                                <TableCell className="flex items-center gap-3">
                                                    <Image src={cat.imageUrl} alt={cat.name} width={32} height={32} className="rounded-md" />
                                                    <span className="font-medium">{cat.name}</span>
                                                </TableCell>
                                                <TableCell className="text-muted-foreground truncate max-w-xs">{cat.description}</TableCell>
                                                <TableCell className="text-right">
                                                    <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleDelete(cat.id, cat.name)}>
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </main>
        </div>
    );
}
