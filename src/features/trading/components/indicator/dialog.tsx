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
  variableName: z
    .string()
    .min(1, "Variable name is required")
    .regex(/^[A-Za-z_$][A-Za-z0-9_$]*$/, "Must be a valid identifier"),
  type: z.enum(["SMA", "EMA", "RSI", "MACD"]),
  period: z.number().int().min(2).max(200),
  source: z.string().min(1),
});

export type IndicatorFormValues = z.infer<typeof formSchema>;

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: IndicatorFormValues) => void;
  defaultValues?: Partial<IndicatorFormValues>;
}

export const IndicatorDialog = ({ open, onOpenChange, onSubmit, defaultValues = {} }: Props) => {
  const form = useForm<IndicatorFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      variableName: defaultValues.variableName ?? "",
      type: defaultValues.type ?? "SMA",
      period: defaultValues.period ?? 20,
      source: defaultValues.source ?? "candle",
    },
  });

  useEffect(() => {
    if (open) {
      form.reset({
        variableName: defaultValues.variableName ?? "",
        type: defaultValues.type ?? "SMA",
        period: defaultValues.period ?? 20,
        source: defaultValues.source ?? "candle",
      });
    }
  }, [open, defaultValues, form]);

  const watchType = form.watch("type");
  const watchPeriod = form.watch("period");
  const watchVar = form.watch("variableName") || "smaResult";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Indicator</DialogTitle>
          <DialogDescription>Configure a technical indicator.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit((v) => { onSubmit(v); onOpenChange(false); })} className="space-y-6 mt-4">
            <FormField control={form.control} name="variableName" render={({ field }) => (
              <FormItem>
                <FormLabel>Variable Name</FormLabel>
                <FormControl><Input placeholder="smaResult" {...field} /></FormControl>
                <FormDescription>Access as {`{{${watchVar}.value}}`}</FormDescription>
                <FormMessage />
              </FormItem>
            )} />
            <div className="grid grid-cols-2 gap-4">
              <FormField control={form.control} name="type" render={({ field }) => (
                <FormItem>
                  <FormLabel>Indicator</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                    <SelectContent>
                      {["SMA", "EMA", "RSI", "MACD"].map(v => (
                        <SelectItem key={v} value={v}>{v}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="period" render={({ field }) => (
                <FormItem>
                  <FormLabel>Period</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={2}
                      max={200}
                      value={field.value ?? ""}
                      onChange={(e) => field.onChange(e.target.value === "" ? undefined : Number(e.target.value))}
                    />
                  </FormControl>
                  <FormDescription>{watchType} {watchPeriod}</FormDescription>
                  <FormMessage />
                </FormItem>
              )} />
            </div>
            <FormField control={form.control} name="source" render={({ field }) => (
              <FormItem>
                <FormLabel>Candle Source</FormLabel>
                <FormControl><Input placeholder="candle" {...field} /></FormControl>
                <FormDescription>Context key containing the candle (default: candle)</FormDescription>
                <FormMessage />
              </FormItem>
            )} />
            <DialogFooter>
              <Button type="submit">Save</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
