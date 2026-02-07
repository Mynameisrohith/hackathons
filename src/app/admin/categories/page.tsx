
"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  collection,
  addDoc,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  serverTimestamp,
  Firestore,
} from "firebase/firestore";
import { useFirestore } from "@/firebase";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import type { Category } from "@/lib/types";
import { PlusCircle, Trash2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useAdmin } from "@/hooks/useAdmin";
import { useRouter } from "next/navigation";
import { Textarea } from "@/components/ui/textarea";
import { useLanguage } from "@/context/LanguageContext";

const categorySchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters."),
  description: z.string().min(10, "Description must be at least 10 characters."),
  imageUrl: z.string().url("Please enter a valid image URL."),
});

function AddCategoryForm({ setOpen, firestore }: { setOpen: (open: boolean) => void; firestore: Firestore }) {
  const { t } = useLanguage();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const form = useForm<z.infer<typeof categorySchema>>({
    resolver: zodResolver(categorySchema),
    defaultValues: { name: "", description: "", imageUrl: "" },
  });

  useEffect(() => {
    // Set a random image URL on mount to avoid hydration errors
    form.setValue('imageUrl', `https://picsum.photos/seed/${Math.random()}/400/300`);
  }, [form]);

  async function onSubmit(values: z.infer<typeof categorySchema>) {
    setIsSubmitting(true);
    try {
      await addDoc(collection(firestore, "categories"), {
        ...values,
        createdAt: serverTimestamp(),
      });
      toast({ title: "Success", description: "Category added successfully." });
      form.reset();
      setOpen(false);
    } catch (error) {
      console.error("Error adding category: ", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to add category.",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 max-h-[70vh] overflow-y-auto p-2">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('categoryName')}</FormLabel>
              <FormControl>
                <Input placeholder={t('categoryNamePlaceholder')} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('description')}</FormLabel>
              <FormControl>
                <Textarea placeholder={t('categoryDescPlaceholder')} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="imageUrl"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('imageUrl')}</FormLabel>
              <FormControl>
                <Input type="url" placeholder="https://example.com/image.png" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? t('adding') : t('addCategory')}
        </Button>
      </form>
    </Form>
  );
}

function CategoryRow({ category, firestore }: { category: Category, firestore: Firestore }) {
  const { t } = useLanguage();
  const handleDelete = async () => {
    try {
      await deleteDoc(doc(firestore, "categories", category.id));
      toast({
        title: "Success",
        description: `Category "${category.name}" deleted.`,
      });
    } catch (error) {
      console.error("Error deleting category:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete category.",
      });
    }
  };

  return (
    <TableRow>
      <TableCell>
        <Image
            src={category.imageUrl}
            alt={category.name}
            width={40}
            height={40}
            className="rounded-md object-cover"
        />
      </TableCell>
      <TableCell className="font-medium">{category.name}</TableCell>
      <TableCell>{category.description}</TableCell>
      <TableCell>
        {category.createdAt?.toDate().toLocaleDateString()}
      </TableCell>
      <TableCell className="text-right">
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="ghost" size="icon">
              <Trash2 className="h-4 w-4" />
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{t('deleteConfirm')}</AlertDialogTitle>
              <AlertDialogDescription>
                {t('deleteCategoryWarning').replace('{name}', category.name)}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>{t('cancel')}</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete}>{t('delete')}</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </TableCell>
    </TableRow>
  );
}

export default function CategoriesPage() {
  const { t } = useLanguage();
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFormOpen, setFormOpen] = useState(false);
  const firestore = useFirestore();
  const { isAdmin, isLoading: isAdminLoading } = useAdmin();
  const router = useRouter();

  useEffect(() => {
    if (!isAdminLoading && !isAdmin) {
      toast({ variant: "destructive", title: "Unauthorized", description: "You do not have permission to access this page." });
      router.replace('/admin/analytics');
    }
  }, [isAdmin, isAdminLoading, router]);

  useEffect(() => {
    if (!firestore || !isAdmin) return;
    const q = query(collection(firestore, "categories"));
    const unsubscribe = onSnapshot(
      q,
      (querySnapshot) => {
        const categoriesData = querySnapshot.docs.map(
          (doc) => ({ id: doc.id, ...doc.data() } as Category)
        );
        setCategories(categoriesData);
        setIsLoading(false);
      },
      (error) => {
        console.error("Error fetching categories:", error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Could not fetch categories.",
        });
        setIsLoading(false);
      }
    );
    return () => unsubscribe();
  }, [firestore, isAdmin]);

  if (isAdminLoading || !isAdmin) {
    return (
      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-64" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-48 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="grid gap-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>{t('productCategories')}</CardTitle>
            <CardDescription>
              {t('manageCategories')}
            </CardDescription>
          </div>
          <Dialog open={isFormOpen} onOpenChange={setFormOpen}>
            <DialogTrigger asChild>
              <Button><PlusCircle className="mr-2"/>{t('addCategory')}</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{t('addNewCategory')}</DialogTitle>
              </DialogHeader>
              {firestore && <AddCategoryForm setOpen={setFormOpen} firestore={firestore} />}
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('imageUrl')}</TableHead>
                <TableHead>{t('categoryName')}</TableHead>
                <TableHead>{t('description')}</TableHead>
                <TableHead>{t('createdAt')}</TableHead>
                <TableHead className="text-right">{t('actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-10 w-10 rounded-md" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-48" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                    <TableCell><Skeleton className="h-8 w-8 float-right" /></TableCell>
                  </TableRow>
                ))
              ) : categories.length > 0 ? (
                categories.map((category) => (
                  <CategoryRow key={category.id} category={category} firestore={firestore!} />
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center">
                    {t('noCategoriesToAdd')}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
