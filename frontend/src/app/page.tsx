import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function Home() {
  return (
    <main className="flex min-h-screen items-center justify-center p-8">
      <Card className="max-w-md">
        <CardHeader>
          <CardTitle>Radar Construtora IA</CardTitle>
          <CardDescription>
            Base do projeto configurada com sucesso. Funcionalidades serão
            adicionadas nas próximas etapas.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button>Começar</Button>
        </CardContent>
      </Card>
    </main>
  );
}
