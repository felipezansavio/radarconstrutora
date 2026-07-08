"use client";

import { useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useMyCompany, useUpdateMyCompany } from "@/hooks/use-companies";
import { ApiError } from "@/lib/api/client";
import { useAuthStore } from "@/stores/auth-store";

const companySchema = z.object({
  name: z.string().min(2, "Informe o nome da empresa"),
  segment: z.string().optional(),
  email: z.string().email("E-mail inválido").optional().or(z.literal("")),
  phone: z.string().optional(),
  website: z.string().optional(),
});

type CompanyFormValues = z.infer<typeof companySchema>;

export function CompanyForm() {
  const { data: company, isLoading } = useMyCompany();
  const updateCompany = useUpdateMyCompany();
  const role = useAuthStore((state) => state.user?.role);
  const isAdmin = role === "ADMIN";

  const form = useForm<CompanyFormValues>({
    resolver: zodResolver(companySchema),
    defaultValues: { name: "", segment: "", email: "", phone: "", website: "" },
  });

  useEffect(() => {
    if (company) {
      form.reset({
        name: company.name,
        segment: company.segment ?? "",
        email: company.email ?? "",
        phone: company.phone ?? "",
        website: company.website ?? "",
      });
    }
  }, [company, form]);

  function onSubmit(values: CompanyFormValues) {
    updateCompany.mutate(values, {
      onSuccess: () => toast.success("Dados da empresa atualizados"),
      onError: (error) => {
        const message =
          error instanceof ApiError
            ? error.message
            : "Não foi possível atualizar os dados da empresa.";
        toast.error(message);
      },
    });
  }

  if (isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-9 w-full" />
        <Skeleton className="h-9 w-full" />
        <Skeleton className="h-9 w-full" />
      </div>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nome da empresa</FormLabel>
              <FormControl>
                <Input disabled={!isAdmin} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="segment"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Segmento</FormLabel>
              <FormControl>
                <Input disabled={!isAdmin} {...field} />
              </FormControl>
            </FormItem>
          )}
        />
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>E-mail</FormLabel>
                <FormControl>
                  <Input disabled={!isAdmin} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Telefone</FormLabel>
                <FormControl>
                  <Input disabled={!isAdmin} {...field} />
                </FormControl>
              </FormItem>
            )}
          />
        </div>
        <FormField
          control={form.control}
          name="website"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Site</FormLabel>
              <FormControl>
                <Input disabled={!isAdmin} {...field} />
              </FormControl>
            </FormItem>
          )}
        />
        {isAdmin && (
          <Button type="submit" disabled={updateCompany.isPending}>
            {updateCompany.isPending ? "Salvando..." : "Salvar alterações"}
          </Button>
        )}
      </form>
    </Form>
  );
}
