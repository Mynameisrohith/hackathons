'use client';

import React, { useState, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useCollection, useMemoFirebase, useFirestore } from '@/firebase';
import { collection, query, addDoc, updateDoc, deleteDoc, doc, serverTimestamp, orderBy } from 'firebase/firestore';
import type { Product, Category } from '@/lib/types';
import { useLanguage } from '@/context/LanguageContext';

import { PageHeader } from '@/components/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { toast } from '@/hooks/use-toast';
import { Loader2, PlusCircle, Trash2, Edit } from 'lucide-react';
import Image from 'next/image';
import { useSearchParams, useRouter } from 'next/navigation';

const productSchema = z.object({
    name: z.string().min(3, 'Name must be at least 3 characters'),
    price: z.coerce.number().min(0.01, 'Price must be greater than 0'),
    stock: z.coerce.number().int().min(0, 'Stock cannot be negative'),
    description: z.string().min(10, 'Description must be at least 10 characters'),
    imageUrl: z.string().url('Must be a valid URL'),
    categoryId: z.string({ required_error: 'Please select a category.' }),
});

function ProductForm({ product, categories, onFinished }: { product?: Product, categories: Category[], onFinished: () => void }) {
    const { t } = useLanguage();
    const firestore = useFirestore();
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    const form = useForm<z.infer<typeof productSchema>>({
        resolver: zodResolver(productSchema),
        defaultValues: product || {
            name: '',
            price: 0,
            stock: 0,
            description: '',
            imageUrl: '',
            categoryId: '',
        },
    });
    
    const onSubmit = async (values: z.infer<typeof productSchema>) => {
        if (!firestore) return;
        setIsSubmitting(true);
        try {
            if (product) {
                // Update existing product
                const productRef = doc(firestore, 'products', product.id);
                await updateDoc(productRef, values);
                toast({ title: "Product Updated", description: `${values.name} has been updated.` });
            } else {
                // Add new product
                await addDoc(collection(firestore, 'products'), { ...values, createdAt: serverTimestamp() });
                toast({ title: "Product Added", description: `${values.name} has been added to the store.` });
            }
            onFinished();
        } catch (error) {
            console.error("Error saving product:", error);
            toast({ variant: 'destructive', title: 'Error', description: 'Could not save product.' });
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField name="name" control={form.control} render={({ field }) => (
                    <FormItem><FormLabel>{t('productName')}</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />

                <div className="grid grid-cols-2 gap-4">
                    <FormField name="price" control={form.control} render={({ field }) => (
                        <FormItem><FormLabel>{t('price')}</FormLabel><FormControl><Input type="number" step="0.01" {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField name="stock" control={form.control} render={({ field }) => (
                        <FormItem><FormLabel>{t('stock')}</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                </div>
                
                 <FormField name="categoryId" control={form.control} render={({ field }) => (
                    <FormItem>
                        <FormLabel>{t('category')}</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl><SelectTrigger><SelectValue placeholder={t('selectCategory')} /></SelectTrigger></FormControl>
                            <SelectContent>
                                {categories.map(cat => <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>)}
                            </SelectContent>
                        </Select>
                        <FormMessage />
                    </FormItem>
                )} />

                <FormField name="imageUrl" control={form.control} render={({ field }) => (
                    <FormItem><FormLabel>{t('imageUrl')}</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField name="description" control={form.control} render={({ field }) => (
                    <FormItem><FormLabel>{t('description')}</FormLabel><FormControl><Textarea {...field} /></FormControl><FormMessage /></FormItem>
                )} />

                <DialogFooter>
                    <DialogClose asChild><Button variant="ghost">{t('cancel')}</Button></DialogClose>
                    <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting && <Loader2 className="animate-spin mr-2" />}
                        {product ? t('saveChanges') : t('addProduct')}
                    </Button>
                </DialogFooter>
            </form>
        </Form>
    );
}

export default function ProductsAdminPage() {
    const { t } = useLanguage();
    const firestore = useFirestore();
    const router = useRouter();
    const searchParams = useSearchParams();

    const [isFormOpen, setIsFormOpen] = useState(searchParams.get('new') === 'true');
    const [selectedProduct, setSelectedProduct] = useState<Product | undefined>(undefined);

    const productsQuery = useMemoFirebase(() => firestore ? query(collection(firestore, 'products'), orderBy('createdAt', 'desc')) : null, [firestore]);
    const categoriesQuery = useMemoFirebase(() => firestore ? query(collection(firestore, 'categories')) : null, [firestore]);

    const { data: products, isLoading: loadingProducts } = useCollection<Product>(productsQuery);
    const { data: categories, isLoading: loadingCategories } = useCollection<Category>(categoriesQuery);

    const isLoading = loadingProducts || loadingCategories;
    
    const openForm = (product?: Product) => {
        setSelectedProduct(product);
        setIsFormOpen(true);
    };

    const closeForm = () => {
        setIsFormOpen(false);
        setSelectedProduct(undefined);
        router.replace('/admin/products');
    };
    
    const handleDelete = async (productId: string) => {
        if (!firestore) return;
        if (confirm('Are you sure you want to delete this product?')) {
            try {
                await deleteDoc(doc(firestore, 'products', productId));
                toast({ title: 'Product Deleted' });
            } catch (error) {
                toast({ variant: 'destructive', title: 'Error', description: 'Failed to delete product.' });
            }
        }
    }

    return (
        <div className="animate-card-enter">
            <PageHeader title={t('productList')} subtitle={t('productListDesc')} />
            <main className="p-4 sm:p-6 lg:p-8">
                <Dialog open={isFormOpen} onOpenChange={isFormOpen ? closeForm : setIsFormOpen}>
                    <Card className="card-glass">
                        <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle>{t('allProducts')}</CardTitle>
                            <DialogTrigger asChild>
                                <Button onClick={() => openForm()}>
                                    <PlusCircle className="mr-2" />
                                    {t('addProductTitle')}
                                </Button>
                            </DialogTrigger>
                        </CardHeader>
                        <CardContent>
                            {isLoading ? (
                                <div className="space-y-2">
                                    {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
                                </div>
                            ) : (
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>{t('product')}</TableHead>
                                            <TableHead>{t('price')}</TableHead>
                                            <TableHead>{t('stock')}</TableHead>
                                            <TableHead className="text-right">{t('actions')}</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {products?.length === 0 && (
                                            <TableRow><TableCell colSpan={4} className="text-center h-24">{t('noProductsToAdd')}</TableCell></TableRow>
                                        )}
                                        {products?.map(product => (
                                            <TableRow key={product.id}>
                                                <TableCell className="flex items-center gap-4">
                                                    <Image src={product.imageUrl} alt={product.name} width={40} height={40} className="rounded-md" />
                                                    <span className="font-medium">{product.name}</span>
                                                </TableCell>
                                                <TableCell>${product.price.toFixed(2)}</TableCell>
                                                <TableCell>{product.stock}</TableCell>
                                                <TableCell className="text-right">
                                                    <Button variant="ghost" size="icon" onClick={() => openForm(product)}>
                                                        <Edit className="h-4 w-4" />
                                                    </Button>
                                                     <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleDelete(product.id)}>
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

                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>{selectedProduct ? 'Edit Product' : t('addProductTitle')}</DialogTitle>
                        </DialogHeader>
                        {loadingCategories ? <Skeleton className="h-96 w-full"/> : (
                             <ProductForm product={selectedProduct} categories={categories || []} onFinished={closeForm} />
                        )}
                    </DialogContent>
                </Dialog>
            </main>
        </div>
    );
}
