"use client";

import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useEffect } from "react";
import { useCredentialsByType } from "@/features/credentials/hooks/use-credentials";
import { CredentialType } from "@/generated/prisma/enums";

const formSchema = z.object({
  exchange: z.enum(["alpaca"]),
  credentialId: z.string().min(1, "Credential is required"),
  symbol: z.string().min(1, "Symbol is required"),
  side: z.enum(["BUY", "SELL"]),
  quantity: z.number().positive("Quantity must be positive"),
  orderType: z.enum(["MARKET", "LIMIT"]),
  limitPrice: z.number().optional(),
});

export type OrderFormValues = z.infer<typeof formSchema>;

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: OrderFormValues) => void;
  defaultValues?: Partial<OrderFormValues>;
}

export const OrderDialog = ({ open, onOpenChange, onSubmit, defaultValues = {} }: Props) => {
  const form = useForm<OrderFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      exchange: defaultValues.exchange ?? "alpaca",
      credentialId: defaultValues.credentialId ?? "",
      symbol: defaultValues.symbol ?? "",
      side: defaultValues.side ?? "BUY",
      quantity: defaultValues.quantity ?? 1,
      orderType: defaultValues.orderType ?? "MARKET",
      limitPrice: defaultValues.limitPrice,
    },
  });

  useEffect(() => {
    if (open) {
      form.reset({
        exchange: defaultValues.exchange ?? "alpaca",
        credentialId: defaultValues.credentialId ?? "",
        symbol: defaultValues.symbol ?? "",
        side: defaultValues.side ?? "BUY",
        quantity: defaultValues.quantity ?? 1,
        orderType: defaultValues.orderType ?? "MARKET",
        limitPrice: defaultValues.limitPrice,
      });
    }
  }, [open, defaultValues, form]);

  const orderType = form.watch("orderType");

  const { data: alpacaCreds } = useCredentialsByType(CredentialType.ALPACA);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Order</DialogTitle>
          <DialogDescription>Configure a paper order. Uses Alpaca paper trading.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit((v) => { onSubmit(v); onOpenChange(false); })} className="space-y-6 mt-4">
            <FormField control={form.control} name="credentialId" render={({ field }) => (
              <FormItem>
                <FormLabel>Alpaca Credential</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl><SelectTrigger><SelectValue placeholder="Select credential" /></SelectTrigger></FormControl>
                  <SelectContent>
                    {(alpacaCreds ?? []).map(c => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormDescription>Add Alpaca credentials in the Credentials page</FormDescription>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="symbol" render={({ field }) => (
              <FormItem>
                <FormLabel>Symbol</FormLabel>
                <FormControl><Input placeholder="AAPL" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <div className="grid grid-cols-3 gap-4">
              <FormField control={form.control} name="side" render={({ field }) => (
                <FormItem>
                  <FormLabel>Side</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                    <SelectContent>
                      <SelectItem value="BUY">BUY</SelectItem>
                      <SelectItem value="SELL">SELL</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="quantity" render={({ field }) => (
                <FormItem>
                  <FormLabel>Quantity</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={0.001}
                      step={0.001}
                      value={field.value ?? ""}
                      onChange={(e) => field.onChange(e.target.value === "" ? undefined : Number(e.target.value))}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="orderType" render={({ field }) => (
                <FormItem>
                  <FormLabel>Type</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                    <SelectContent>
                      <SelectItem value="MARKET">MARKET</SelectItem>
                      <SelectItem value="LIMIT">LIMIT</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
            </div>
            {orderType === "LIMIT" && (
              <FormField control={form.control} name="limitPrice" render={({ field }) => (
                <FormItem>
                  <FormLabel>Limit Price</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step={0.01}
                      placeholder="150.00"
                      value={field.value ?? ""}
                      onChange={(e) => field.onChange(e.target.value === "" ? undefined : Number(e.target.value))}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            )}
            <DialogFooter>
              <Button type="submit">Save</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
