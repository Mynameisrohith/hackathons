
"use client";

import React, { useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  collection,
  onSnapshot,
  query,
  serverTimestamp,
  writeBatch,
  doc,
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "@/hooks/use-toast";
import type { Product, Sale } from "@/lib/types";
import { Skeleton } from "@/components/ui/skeleton";

const saleSchema = z.object({
  productId: z.string().min(1, "Please select a product."),
  quantity: z.coerce
    .number()
    .int()
    .positive("Quantity must be a positive number."),
});

function RecordSaleForm({ products, firestore }: { products: Product[]; firestore: Firestore }) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const form = useForm<z.infer<typeof saleSchema>>({
    resolver: zodResolver(saleSchema),
    defaultValues: { productId: "", quantity: 1 },
  });

  const selectedProductId = form.watch("productId");
  const quantity = form.watch("quantity");
  const selectedProduct = products.find((p) => p.id === selectedProductId);
  const totalAmount = selectedProduct ? selectedProduct.price * quantity : 0;
  
  useEffect(() => {
    if (selectedProduct && quantity > selectedProduct.stock) {
      form.setError("quantity", {
        type: "manual",
        message: `Only ${selectedProduct.stock} in stock.`,
      });
    } else {
      form.clearErrors("quantity");
    }
  }, [quantity, selectedProduct, form]);

  async function onSubmit(values: z.infer<typeof saleSchema>) {
    if (!selectedProduct) {
        toast({ variant: "destructive", title: "Error", description: "Product not found." });
        return;
    }
    if (values.quantity > selectedProduct.stock) {
        form.setError("quantity", { type: "manual", message: "Not enough stock." });
        return;
    }
    
    setIsSubmitting(true);
    try {
      const batch = writeBatch(firestore);
      
      const saleRef = doc(collection(firestore, "sales"));
      batch.set(saleRef, {
        productId: values.productId,
        productName: selectedProduct.name,
        quantity: values.quantity,
        totalAmount: selectedProduct.price * values.quantity,
        createdAt: serverTimestamp(),
      });
      
      const productRef = doc(firestore, "products", values.productId);
      batch.update(productRef, {
        stock: selectedProduct.stock - values.quantity,
      });

      await batch.commit();
      
      toast({ title: "Success", description: "Sale recorded successfully." });
      form.reset();
    } catch (error) {
      console.error("Error recording sale: ", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to record sale.",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="productId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Product</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a product" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {products.map((product) => (
                    <SelectItem key={product.id} value={product.id}>
                      {product.name} (Stock: {product.stock})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="quantity"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Quantity</FormLabel>
              <FormControl>
                <Input type="number" placeholder="1" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="text-lg font-semibold">
            Total: ${totalAmount.toFixed(2)}
        </div>
        <Button type="submit" disabled={isSubmitting || !form.formState.isValid}>
          {isSubmitting ? "Recording..." : "Record Sale"}
        </Button>
      </form>
    </Form>
  );
}

export default function SalesPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const firestore = useFirestore();

  useEffect(() => {
    if (!firestore) return;

    const productsQuery = query(collection(firestore, "products"));
    const salesQuery = query(collection(firestore, "sales"));
    
    const unsubProducts = onSnapshot(productsQuery, (snapshot) => {
        setProducts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product)));
        setIsLoading(false);
    });
    
    const unsubSales = onSnapshot(salesQuery, (snapshot) => {
        setSales(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Sale)));
    });

    return () => {
      unsubProducts();
      unsubSales();
    };
  }, [firestore]);

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Card className="md:col-span-1">
        <CardHeader>
          <CardTitle>Record a New Sale</CardTitle>
          <CardDescription>Select a product and quantity to record a sale.</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading || !firestore ? <Skeleton className="h-64 w-full"/> : <RecordSaleForm products={products} firestore={firestore} />}
        </CardContent>
      </Card>
      <Card className="md:col-span-1">
        <CardHeader>
          <CardTitle>Sales History</CardTitle>
          <CardDescription>A log of all past sales transactions.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead>Qty</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
            {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-8" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-16" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                  </TableRow>
                ))
              ) : sales.length > 0 ? (
                sales.map((sale) => (
                  <TableRow key={sale.id}>
                    <TableCell>{sale.productName}</TableCell>
                    <TableCell>{sale.quantity}</TableCell>
                    <TableCell>${sale.totalAmount.toFixed(2)}</TableCell>
                    <TableCell>{sale.createdAt?.toDate().toLocaleDateString()}</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={4} className="h-24 text-center">
                    No sales recorded yet.
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
