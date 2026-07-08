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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useBuilders } from "@/hooks/use-builders";
import { useCreateLead } from "@/hooks/use-leads";
import { useProjects } from "@/hooks/use-projects";
import { ApiError } from "@/lib/api/client";
import { LEAD_TEMPERATURE_LABELS } from "@/lib/labels";
import type { LeadTemperature } from "@/types/api";

const leadSchema = z.object({
  companyId: z.string().uuid("Selecione a construtora"),
  developmentId: z.string().optional(),
  temperature: z.custom<LeadTemperature>().optional(),
  notes: z.string().optional(),
});

type LeadFormValues = z.infer<typeof leadSchema>;

export function LeadFormDialog() {
  const [open, setOpen] = useState(false);
  const { data: buildersData } = useBuilders({ pageSize: 100 });
  const createLead = useCreateLead();

  const form = useForm<LeadFormValues>({
    resolver: zodResolver(leadSchema),
    defaultValues: { companyId: "", developmentId: "", notes: "" },
  });

  const companyId = form.watch("companyId");
  const { data: projectsData } = useProjects({
    companyId: companyId || undefined,
    pageSize: 50,
  });

  function onSubmit(values: LeadFormValues) {
    createLead.mutate(
      {
        companyId: values.companyId,
        developmentId: values.developmentId || undefined,
        temperature: values.temperature,
        notes: values.notes || undefined,
      },
      {
        onSuccess: () => {
          toast.success("Lead criado com sucesso");
          form.reset();
          setOpen(false);
        },
        onError: (error) => {
          const message =
            error instanceof ApiError
              ? error.message
              : "Não foi possível criar o lead.";
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
          Novo lead
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Criar lead</DialogTitle>
          <DialogDescription>
            Adicione uma oportunidade comercial ao funil de vendas.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
            <FormField
              control={form.control}
              name="developmentId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Empreendimento (opcional)</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                    disabled={!companyId}
                  >
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Selecione o empreendimento" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {projectsData?.data.map((project) => (
                        <SelectItem key={project.id} value={project.id}>
                          {project.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="temperature"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Temperatura</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Morno" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {Object.entries(LEAD_TEMPERATURE_LABELS).map(
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
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Observações</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Detalhes sobre a oportunidade..."
                      {...field}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="submit" disabled={createLead.isPending}>
                {createLead.isPending ? "Criando..." : "Criar lead"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
