"use client";

import React, { useEffect, useState } from "react";
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

const categorySchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters."),
  description: z.string().min(10, "Description must be at least 10 characters."),
});

function AddCategoryForm({ setOpen, firestore }: { setOpen: (open: boolean) => void; firestore: Firestore }) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const form = useForm<z.infer<typeof categorySchema>>({
    resolver: zodResolver(categorySchema),
    defaultValues: { name: "", description: "" },
  });

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
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Category Name</FormLabel>
              <FormControl>
                <Input placeholder="e.g., Electronics" {...field} />
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
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea placeholder="A short description of the category." {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Adding..." : "Add Category"}
        </Button>
      </form>
    </Form>
  );
}

function CategoryRow({ category, firestore }: { category: Category, firestore: Firestore }) {
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
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete the
                category "{category.name}".
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </TableCell>
    </TableRow>
  );
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFormOpen, setFormOpen] = useState(false);
  const firestore = useFirestore();
  const { isAdmin, isLoading: isAdminLoading } = useAdmin();
  const router = useRouter();

  useEffect(() => {
    if (!isAdminLoading && !isAdmin) {
      toast({ variant: "destructive", title: "Unauthorized", description: "You do not have permission to access this page." });
      router.replace('/');
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
            <CardTitle>Product Categories</CardTitle>
            <CardDescription>
              Manage your product categories.
            </CardDescription>
          </div>
          <Dialog open={isFormOpen} onOpenChange={setFormOpen}>
            <DialogTrigger asChild>
              <Button><PlusCircle className="mr-2"/>Add Category</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Category</DialogTitle>
              </DialogHeader>
              {firestore && <AddCategoryForm setOpen={setFormOpen} firestore={firestore} />}
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Created At</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <TableRow key={i}>
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
                  <TableCell colSpan={4} className="h-24 text-center">
                    No categories found. Add one to get started!
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
