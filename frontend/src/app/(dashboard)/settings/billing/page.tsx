import { CompanyForm } from "@/components/settings/company-form";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function BillingSettingsPage() {
  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Dados da empresa</CardTitle>
          <CardDescription>
            Informações da sua empresa no Radar Construtora IA.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <CompanyForm />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Plano atual</CardTitle>
            <Badge>Gratuito</Badge>
          </div>
          <CardDescription>
            A cobrança de planos ainda não está disponível nesta versão.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">
            Em breve você poderá escolher entre planos com diferentes limites
            de buscas, usuários e integrações.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
