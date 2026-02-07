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
  updateDoc,
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
import type { Product } from "@/lib/types";
import { PlusCircle, Trash2, Save } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

const productSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters."),
  price: z.coerce.number().positive("Price must be a positive number."),
  stock: z.coerce.number().int().min(0, "Stock cannot be negative."),
});

function AddProductForm({ setOpen, firestore }: { setOpen: (open: boolean) => void; firestore: Firestore }) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const form = useForm<z.infer<typeof productSchema>>({
    resolver: zodResolver(productSchema),
    defaultValues: { name: "", price: 0, stock: 0 },
  });

  async function onSubmit(values: z.infer<typeof productSchema>) {
    setIsSubmitting(true);
    try {
      await addDoc(collection(firestore, "products"), {
        ...values,
        createdAt: serverTimestamp(),
      });
      toast({ title: "Success", description: "Product added successfully." });
      form.reset();
      setOpen(false);
    } catch (error) {
      console.error("Error adding product: ", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to add product.",
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
              <FormLabel>Product Name</FormLabel>
              <FormControl>
                <Input placeholder="e.g., T-Shirt" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="price"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Price</FormLabel>
              <FormControl>
                <Input type="number" step="0.01" placeholder="9.99" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="stock"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Stock</FormLabel>
              <FormControl>
                <Input type="number" placeholder="100" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Adding..." : "Add Product"}
        </Button>
      </form>
    </Form>
  );
}

function ProductRow({ product, firestore }: { product: Product, firestore: Firestore }) {
  const [stock, setStock] = useState(product.stock);
  const [isUpdating, setIsUpdating] = useState(false);

  const handleDelete = async () => {
    try {
      await deleteDoc(doc(firestore, "products", product.id));
      toast({
        title: "Success",
        description: `Product "${product.name}" deleted.`,
      });
    } catch (error) {
      console.error("Error deleting product:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete product.",
      });
    }
  };
  
  const handleUpdateStock = async () => {
    if (stock === product.stock) return;
    setIsUpdating(true);
    try {
        await updateDoc(doc(firestore, "products", product.id), { stock });
        toast({ title: "Success", description: "Stock updated." });
    } catch(e) {
        toast({ variant: "destructive", title: "Error", description: "Failed to update stock." });
        setStock(product.stock); // revert
    } finally {
        setIsUpdating(false);
    }
  }

  return (
    <TableRow>
      <TableCell className="font-medium">{product.name}</TableCell>
      <TableCell>${product.price.toFixed(2)}</TableCell>
      <TableCell>
        <div className="flex items-center gap-2">
            <Input 
                type="number"
                value={stock}
                onChange={(e) => setStock(Number(e.target.value))}
                className="h-8 w-20"
                disabled={isUpdating}
            />
            <Button size="icon" variant="ghost" className="h-8 w-8" onClick={handleUpdateStock} disabled={isUpdating || stock === product.stock}>
                <Save className="h-4 w-4" />
            </Button>
        </div>
      </TableCell>
      <TableCell>
        {product.createdAt?.toDate().toLocaleDateString()}
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
                product "{product.name}".
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

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFormOpen, setFormOpen] = useState(false);
  const firestore = useFirestore();

  useEffect(() => {
    if (!firestore) return;
    const q = query(collection(firestore, "products"));
    const unsubscribe = onSnapshot(
      q,
      (querySnapshot) => {
        const productsData = querySnapshot.docs.map(
          (doc) => ({ id: doc.id, ...doc.data() } as Product)
        );
        setProducts(productsData);
        setIsLoading(false);
      },
      (error) => {
        console.error("Error fetching products:", error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Could not fetch products.",
        });
        setIsLoading(false);
      }
    );
    return () => unsubscribe();
  }, [firestore]);

  return (
    <div className="grid gap-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Product List</CardTitle>
            <CardDescription>
              An overview of all products in your inventory.
            </CardDescription>
          </div>
          <Dialog open={isFormOpen} onOpenChange={setFormOpen}>
            <DialogTrigger asChild>
              <Button><PlusCircle className="mr-2"/>Add Product</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Product</DialogTitle>
              </DialogHeader>
              {firestore && <AddProductForm setOpen={setFormOpen} firestore={firestore} />}
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Stock</TableHead>
                <TableHead>Created At</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-16" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-12" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                    <TableCell><Skeleton className="h-8 w-8 float-right" /></TableCell>
                  </TableRow>
                ))
              ) : products.length > 0 ? (
                products.map((product) => (
                  <ProductRow key={product.id} product={product} firestore={firestore!} />
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center">
                    No products found. Add one to get started!
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
