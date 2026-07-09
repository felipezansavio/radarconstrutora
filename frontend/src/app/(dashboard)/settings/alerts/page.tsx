"use client";

import { useEffect, useRef, useState } from "react";
import { LocateFixed, Radar, Search } from "lucide-react";
import { toast } from "sonner";

import { RadiusSelector } from "@/components/search/radius-selector";
import { LoadingState } from "@/components/shared/loading-state";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useRunAlertsScan } from "@/hooks/use-alerts";
import { useMyCompany, useUpdateMyCompany } from "@/hooks/use-companies";
import { useLocationSearch } from "@/hooks/use-location-search";
import { ApiError } from "@/lib/api/client";

export default function AlertsSettingsPage() {
  const { data: company, isLoading } = useMyCompany();
  const updateCompany = useUpdateMyCompany();
  const runScan = useRunAlertsScan();

  const {
    city,
    setCity,
    state,
    setState,
    zipCode,
    setZipCode,
    latitude,
    setLatitude,
    longitude,
    setLongitude,
    locationLabel,
    geocoding,
    useBrowserLocation,
    resolveCoordinates,
  } = useLocationSearch();

  const [alertsEnabled, setAlertsEnabled] = useState(true);
  const [radiusKm, setRadiusKm] = useState(10);
  const [whatsappNumber, setWhatsappNumber] = useState("");
  const prefilled = useRef(false);

  useEffect(() => {
    if (!company || prefilled.current) return;
    prefilled.current = true;
    setAlertsEnabled(company.alertsEnabled);
    setRadiusKm(company.monitoringRadiusKm);
    setWhatsappNumber(company.whatsappNumber ?? "");
    if (company.monitoringLatitude && company.monitoringLongitude) {
      setLatitude(String(company.monitoringLatitude));
      setLongitude(String(company.monitoringLongitude));
    }
  }, [company, setLatitude, setLongitude]);

  const hasLocation = Boolean(company?.monitoringLatitude && company?.monitoringLongitude);

  async function handleSave() {
    const location = await resolveCoordinates();
    if (!location) return;

    updateCompany.mutate(
      {
        alertsEnabled,
        monitoringLatitude: location.latitude,
        monitoringLongitude: location.longitude,
        monitoringRadiusKm: radiusKm,
        whatsappNumber: whatsappNumber || undefined,
      },
      {
        onSuccess: () => toast.success("Configurações de monitoramento salvas"),
        onError: (err) => {
          const message =
            err instanceof ApiError
              ? err.message
              : "Não foi possível salvar as configurações.";
          toast.error(message);
        },
      },
    );
  }

  function handleRunScan() {
    runScan.mutate(undefined, {
      onSuccess: (result) => {
        if (result.notified === 0) {
          toast.info(
            `Busca concluída: ${result.scanned} empreendimento(s) na área, nenhuma oportunidade nova.`,
          );
        } else {
          toast.success(
            `Busca concluída: ${result.notified} nova(s) oportunidade(s) notificada(s).`,
          );
        }
      },
      onError: (err) => {
        const message =
          err instanceof ApiError
            ? err.message
            : "Não foi possível executar a busca agora.";
        toast.error(message);
      },
    });
  }

  if (isLoading) {
    return <LoadingState label="Carregando configurações..." />;
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Radar className="size-4" />
            <CardTitle className="text-base">Monitoramento automático</CardTitle>
          </div>
          <CardDescription>
            Todos os dias o radar busca novos empreendimentos próximos à sua
            empresa e avisa quando surgir uma oportunidade.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="flex items-center justify-between">
            <Label htmlFor="alerts-enabled" className="text-sm font-normal">
              Alertas ativos
            </Label>
            <Switch
              id="alerts-enabled"
              checked={alertsEnabled}
              onCheckedChange={setAlertsEnabled}
            />
          </div>

          <div className="space-y-3">
            <Label className="text-muted-foreground text-xs uppercase">
              Localização da sua empresa
            </Label>
            <Input
              placeholder="Cidade"
              value={city}
              onChange={(e) => setCity(e.target.value)}
            />
            <div className="grid grid-cols-2 gap-2">
              <Input
                placeholder="Estado (UF)"
                maxLength={2}
                value={state}
                onChange={(e) => setState(e.target.value.toUpperCase())}
              />
              <Input
                placeholder="CEP"
                value={zipCode}
                onChange={(e) => setZipCode(e.target.value)}
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Input
                placeholder="Latitude"
                value={latitude}
                onChange={(e) => setLatitude(e.target.value)}
              />
              <Input
                placeholder="Longitude"
                value={longitude}
                onChange={(e) => setLongitude(e.target.value)}
              />
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="w-full"
              onClick={useBrowserLocation}
            >
              <LocateFixed />
              Usar minha localização
            </Button>
            {locationLabel && (
              <p className="text-muted-foreground text-xs">
                📍 {locationLabel}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label className="text-muted-foreground text-xs uppercase">
              Raio de monitoramento
            </Label>
            <RadiusSelector value={radiusKm} onChange={setRadiusKm} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="whatsapp-number" className="text-sm font-normal">
              WhatsApp para alertas
            </Label>
            <Input
              id="whatsapp-number"
              placeholder="+55 11 90000-0000"
              value={whatsappNumber}
              onChange={(e) => setWhatsappNumber(e.target.value)}
            />
            <p className="text-muted-foreground text-xs">
              Em breve: notificações via WhatsApp. Deixe seu número cadastrado
              para já ficar pronto quando a integração for lançada.
            </p>
          </div>

          <Button
            className="w-full"
            onClick={handleSave}
            disabled={geocoding || updateCompany.isPending}
          >
            {geocoding || updateCompany.isPending
              ? "Salvando..."
              : "Salvar configurações"}
          </Button>
        </CardContent>
      </Card>

      <Card className="h-fit">
        <CardHeader>
          <CardTitle className="text-base">Buscar agora</CardTitle>
          <CardDescription>
            Executa o monitoramento imediatamente, sem esperar a busca diária
            automática.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            variant="outline"
            className="w-full"
            onClick={handleRunScan}
            disabled={!hasLocation || runScan.isPending}
          >
            <Search />
            {runScan.isPending ? "Buscando..." : "Buscar oportunidades agora"}
          </Button>
          {!hasLocation && (
            <p className="text-muted-foreground mt-2 text-xs">
              Salve a localização da sua empresa para poder buscar
              oportunidades.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
