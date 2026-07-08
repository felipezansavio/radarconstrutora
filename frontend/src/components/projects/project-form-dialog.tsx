"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
import { useBuilders } from "@/hooks/use-builders";
import { useCreateProject } from "@/hooks/use-projects";
import { ApiError } from "@/lib/api/client";
import {
  CONSTRUCTION_STATUS_LABELS,
  DEVELOPMENT_STANDARD_LABELS,
  PROPERTY_TYPE_LABELS,
} from "@/lib/labels";
import type {
  ConstructionStatus,
  DevelopmentStandard,
  PropertyType,
} from "@/types/api";

const projectSchema = z.object({
  name: z.string().min(2, "Informe o nome do empreendimento"),
  companyId: z.string().uuid("Selecione a construtora"),
  status: z.custom<ConstructionStatus>().optional(),
  standard: z.custom<DevelopmentStandard>().optional(),
  propertyType: z.custom<PropertyType>().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  unitsCount: z.string().optional(),
  floorsCount: z.string().optional(),
});

type ProjectFormValues = z.infer<typeof projectSchema>;

export function ProjectFormDialog() {
  const [open, setOpen] = useState(false);
  const { data: buildersData } = useBuilders({ pageSize: 100 });
  const createProject = useCreateProject();

  const form = useForm<ProjectFormValues>({
    resolver: zodResolver(projectSchema),
    defaultValues: { name: "", companyId: "", city: "", state: "" },
  });

  function onSubmit(values: ProjectFormValues) {
    createProject.mutate(
      {
        ...values,
        unitsCount: values.unitsCount ? Number(values.unitsCount) : undefined,
        floorsCount: values.floorsCount
          ? Number(values.floorsCount)
          : undefined,
      },
      {
        onSuccess: () => {
          toast.success("Empreendimento cadastrado com sucesso");
          form.reset();
          setOpen(false);
        },
        onError: (error) => {
          const message =
            error instanceof ApiError
              ? error.message
              : "Não foi possível cadastrar o empreendimento.";
          toast.error(message);
        },
      },
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus />
          Novo empreendimento
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Cadastrar empreendimento</DialogTitle>
          <DialogDescription>
            Adicione um empreendimento vinculado a uma construtora.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome</FormLabel>
                  <FormControl>
                    <Input placeholder="Edifício Horizonte" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="companyId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Construtora</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Selecione a construtora" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {buildersData?.data.map((builder) => (
                        <SelectItem key={builder.id} value={builder.id}>
                          {builder.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fase da obra</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Fase" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Object.entries(CONSTRUCTION_STATUS_LABELS).map(
                          ([value, label]) => (
                            <SelectItem key={value} value={value}>
                              {label}
                            </SelectItem>
                          ),
                        )}
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="standard"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Padrão</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Padrão" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Object.entries(DEVELOPMENT_STANDARD_LABELS).map(
                          ([value, label]) => (
                            <SelectItem key={value} value={value}>
                              {label}
                            </SelectItem>
                          ),
                        )}
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="propertyType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Tipo" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Object.entries(PROPERTY_TYPE_LABELS).map(
                          ([value, label]) => (
                            <SelectItem key={value} value={value}>
                              {label}
                            </SelectItem>
                          ),
                        )}
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="city"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cidade</FormLabel>
                    <FormControl>
                      <Input placeholder="São Paulo" {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="state"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Estado</FormLabel>
                    <FormControl>
                      <Input placeholder="SP" maxLength={2} {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="unitsCount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Unidades</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="120" {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="floorsCount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Pavimentos</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="12" {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>
            <DialogFooter>
              <Button type="submit" disabled={createProject.isPending}>
                {createProject.isPending ? "Salvando..." : "Salvar"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
