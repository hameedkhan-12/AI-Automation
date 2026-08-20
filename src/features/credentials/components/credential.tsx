"use client";

import { CredentialType } from "@/generated/prisma/enums";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  useCreateCredential,
  useUpdateCredential,
  useSuspenseCredential,
} from "../hooks/use-credentials";
import { useUpgradeModal } from "@/hooks/use-upgrade-modal";
import { useForm } from "react-hook-form";
import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import z from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";

const EXCHANGE_TYPES = new Set<CredentialType>([
  CredentialType.ALPACA,
  CredentialType.BINANCE,
]);

const formSchema = z.object({
  name: z.string().min(1, "Name is required"),
  type: z.enum(CredentialType),
  value: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

const credentialTypeOptions = [
  {
    value: CredentialType.OPENAI,
    label: "OpenAI",
    logo: "/logos/openai.svg",
  },
  {
    value: CredentialType.ANTHROPIC,
    label: "Anthropic",
    logo: "/logos/anthropic.svg",
  },
  {
    value: CredentialType.GEMINI,
    label: "Gemini",
    logo: "/logos/gemini.svg",
  },
  {
    value: CredentialType.ALPACA,
    label: "Alpaca (Paper Trading)",
    logo: "/logos/alpaca.svg",
  },
  {
    value: CredentialType.BINANCE,
    label: "Binance (Testnet)",
    logo: "/logos/binance.svg",
  },
];

interface CredentialFormProps {
  initialData?: {
    id?: string;
    name: string;
    type: CredentialType;
    value: string;
  };
};

export const CredentialForm = ({
  initialData,
}: CredentialFormProps) => {
  const router = useRouter();
  const createCredential = useCreateCredential();
  const updateCredential = useUpdateCredential();
  const { handleError, modal } = useUpgradeModal();

  const isEdit = !!initialData?.id;

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: initialData || {
      name: "",
      type: CredentialType.OPENAI,
      value: "",
    },
  });

  const selectedType = form.watch("type");
  const isExchangeType = EXCHANGE_TYPES.has(selectedType);

  const [apiKeyId, setApiKeyId] = useState("");
  const [apiSecret, setApiSecret] = useState("");
  const [exchangeError, setExchangeError] = useState<string | null>(null);

  const onSubmit = async (values: FormValues) => {
    let finalValue: string;

    if (isExchangeType) {
      if (!apiKeyId.trim() || !apiSecret.trim()) {
        setExchangeError("Both API Key ID and Secret Key are required.");
        return;
      }
      setExchangeError(null);
      finalValue = JSON.stringify({ apiKey: apiKeyId.trim(), apiSecret: apiSecret.trim() });
    } else {
      if (!values.value?.trim()) {
        form.setError("value", { message: "API key is required" });
        return;
      }
      finalValue = values.value.trim();
    }

    const submitValues = { name: values.name, type: values.type, value: finalValue };

    if (isEdit && initialData?.id) {
      await updateCredential.mutateAsync({
        id: initialData.id,
        ...submitValues,
      })
    } else {
      await createCredential.mutateAsync(submitValues, {
        onSuccess: (data) => {
          router.push(`/credentials/${data.id}`);
        },
        onError: (error) => {
          handleError(error);
        }
      })
    }
  }

  return (
    <>
      {modal}
      <Card className="shadow-none">
        <CardHeader>
          <CardTitle>
            {isEdit ? "Edit Credential" : "Create Credential"}
          </CardTitle>
          <CardDescription>
            {isEdit
              ? "Update your API key or credential details"
              : "Add a new API key or credential to your account"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input placeholder="My API key" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Type</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {credentialTypeOptions.map((option) => (
                          <SelectItem
                            key={option.value}
                            value={option.value}
                          >
                            <div className="flex items-center gap-2">
                              <Image
                                src={option.logo}
                                alt={option.label}
                                width={16}
                                height={16}
                              />
                              {option.label}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {isExchangeType ? (
                <>
                  <div className="space-y-2">
                    <FormLabel>API Key ID</FormLabel>
                    <Input
                      type="password"
                      placeholder="APCA-API-KEY-ID"
                      value={apiKeyId}
                      onChange={(e) => setApiKeyId(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <FormLabel>Secret Key</FormLabel>
                    <Input
                      type="password"
                      placeholder="APCA-API-SECRET-KEY"
                      value={apiSecret}
                      onChange={(e) => setApiSecret(e.target.value)}
                    />
                  </div>
                  {isEdit && (
                    <p className="text-sm text-muted-foreground">
                      For security, existing keys aren't shown — enter both values again to update this credential.
                    </p>
                  )}
                  {exchangeError && (
                    <p className="text-sm text-destructive">{exchangeError}</p>
                  )}
                </>
              ) : (
                <FormField
                  control={form.control}
                  name="value"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>API Key</FormLabel>
                      <FormControl>
                        <Input
                          type="password"
                          placeholder="sk-..."
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              <div className="flex gap-4">
                <Button
                  type="submit"
                  disabled={
                    createCredential.isPending ||
                    updateCredential.isPending
                  }
                >
                  {isEdit ? "Update" : "Create"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  asChild
                >
                  <Link href="/credentials" prefetch>
                    Cancel
                  </Link>
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </>
  )
};

export const CredentialView = ({
  credentialId,
}: { credentialId: string }) => {
  const { data: credential } = useSuspenseCredential(credentialId);

  return <CredentialForm initialData={credential} />
};