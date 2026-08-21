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
import { useEffect, useState } from "react";

const OPERATORS = [">", "<", ">=", "<=", "==", "!=", "crosses_above", "crosses_below"] as const;

const formSchema = z.object({
  leftPath: z.string().min(1, "Left value is required"),
  operator: z.enum(OPERATORS),
  rightPath: z.string().optional(),
  rightValue: z.number().optional(),
}).refine((v) => v.rightPath || v.rightValue !== undefined, {
  message: "Provide either a right-hand path or a constant value",
  path: ["rightPath"],
});

export type ConditionFormValues = z.infer<typeof formSchema>;

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: ConditionFormValues) => void;
  defaultValues?: Partial<ConditionFormValues>;
}

export const ConditionDialog = ({ open, onOpenChange, onSubmit, defaultValues = {} }: Props) => {
  const [rightMode, setRightMode] = useState<"path" | "value">(
    defaultValues.rightValue !== undefined ? "value" : "path",
  );

  const form = useForm<ConditionFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      leftPath: defaultValues.leftPath ?? "",
      operator: defaultValues.operator ?? "crosses_above",
      rightPath: defaultValues.rightPath ?? "",
      rightValue: defaultValues.rightValue,
    },
  });

  useEffect(() => {
    if (open) {
      form.reset({
        leftPath: defaultValues.leftPath ?? "",
        operator: defaultValues.operator ?? "crosses_above",
        rightPath: defaultValues.rightPath ?? "",
        rightValue: defaultValues.rightValue,
      });
      setRightMode(defaultValues.rightValue !== undefined ? "value" : "path");
    }
  }, [open, defaultValues, form]);

  const handleSubmit = (values: ConditionFormValues) => {
    const cleaned =
      rightMode === "value"
        ? { ...values, rightPath: undefined }
        : { ...values, rightValue: undefined };
    onSubmit(cleaned);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Condition</DialogTitle>
          <DialogDescription>
            Only continue to downstream nodes when this comparison is true. Useful for gating an
            Order node on an indicator crossover instead of firing on every execution.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6 mt-4">
            <FormField control={form.control} name="leftPath" render={({ field }) => (
              <FormItem>
                <FormLabel>Left value (context path)</FormLabel>
                <FormControl><Input placeholder="fastSma.value" {...field} /></FormControl>
                <FormDescription>Dot path into the workflow context, e.g. fastSma.value</FormDescription>
                <FormMessage />
              </FormItem>
            )} />

            <FormField control={form.control} name="operator" render={({ field }) => (
              <FormItem>
                <FormLabel>Operator</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                  <SelectContent>
                    {OPERATORS.map((op) => (
                      <SelectItem key={op} value={op}>
                        {op === "crosses_above" ? "crosses above" : op === "crosses_below" ? "crosses below" : op}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormDescription>
                  "crosses above/below" only fires on the tick the relationship changes — use this for
                  a crossover strategy, not a plain "&gt;", which would fire on every tick it stays true.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )} />

            <div className="flex gap-2 text-sm">
              <button
                type="button"
                className={rightMode === "path" ? "underline font-medium" : "text-muted-foreground"}
                onClick={() => setRightMode("path")}
              >
                Compare to another value
              </button>
              <span className="text-muted-foreground">·</span>
              <button
                type="button"
                className={rightMode === "value" ? "underline font-medium" : "text-muted-foreground"}
                onClick={() => setRightMode("value")}
              >
                Compare to a constant
              </button>
            </div>

            {rightMode === "path" ? (
              <FormField control={form.control} name="rightPath" render={({ field }) => (
                <FormItem>
                  <FormLabel>Right value (context path)</FormLabel>
                  <FormControl><Input placeholder="slowSma.value" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            ) : (
              <FormField control={form.control} name="rightValue" render={({ field }) => (
                <FormItem>
                  <FormLabel>Right value (constant)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
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