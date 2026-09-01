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

const formSchema = z.object({
  symbol: z.string().min(1, "Symbol is required").toUpperCase(),
  exchange: z.enum(["alpaca"]),
  interval: z.enum(["1m", "5m", "15m", "1h", "1d"]),
});

export type MarketDataTriggerFormValues = z.infer<typeof formSchema>;

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: MarketDataTriggerFormValues) => void;
  defaultValues?: Partial<MarketDataTriggerFormValues>;
}

export const MarketDataTriggerDialog = ({ open, onOpenChange, onSubmit, defaultValues = {} }: Props) => {
  const form = useForm<MarketDataTriggerFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      symbol: defaultValues.symbol ?? "",
      exchange: defaultValues.exchange ?? "alpaca",
      interval: defaultValues.interval ?? "1d",
    },
  });

  useEffect(() => {
    if (open) {
      form.reset({
        symbol: defaultValues.symbol ?? "",
        exchange: defaultValues.exchange ?? "alpaca",
        interval: defaultValues.interval ?? "1d",
      });
    }
  }, [open, defaultValues, form]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Market Data Trigger</DialogTitle>
          <DialogDescription>Configure which market to watch.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit((v) => { onSubmit(v); onOpenChange(false); })} className="space-y-6 mt-4">
            <FormField control={form.control} name="symbol" render={({ field }) => (
              <FormItem>
                <FormLabel>Symbol</FormLabel>
                <FormControl><Input placeholder="AAPL" {...field} /></FormControl>
                <FormDescription>Ticker symbol (e.g. AAPL, TSLA)</FormDescription>
                <FormMessage />
              </FormItem>
            )} />
            <div className="grid grid-cols-2 gap-4">
              <FormField control={form.control} name="exchange" render={({ field }) => (
                <FormItem>
                  <FormLabel>Exchange</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                    <SelectContent><SelectItem value="alpaca">Alpaca</SelectItem></SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="interval" render={({ field }) => (
                <FormItem>
                  <FormLabel>Interval</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                    <SelectContent>
                      {["1m", "5m", "15m", "1h", "1d"].map(v => (
                        <SelectItem key={v} value={v}>{v}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
            </div>
            <DialogFooter>
              <Button type="submit">Save</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
