import Link from "next/link";
import { Landmark, MapPin } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { formatDistance } from "@/lib/format";
import {
  CONSTRUCTION_STATUS_LABELS,
  DEVELOPMENT_STANDARD_LABELS,
} from "@/lib/labels";
import { getPotentialFromScore } from "@/lib/potential";
import type { NearbyCompanyResult, NearbyDevelopmentResult } from "@/types/api";

export function BuilderResultCard({ result }: { result: NearbyCompanyResult }) {
  return (
    <Link href={`/builders/${result.id}`}>
      <Card className="hover:border-primary/50 transition-colors">
        <CardContent className="flex items-start justify-between gap-3 pt-6">
          <div className="flex items-start gap-3">
            <div className="bg-primary/10 text-primary flex size-9 shrink-0 items-center justify-center rounded-md">
              <Landmark className="size-4" />
            </div>
            <div>
              <div className="font-medium">{result.name}</div>
              <div className="text-muted-foreground flex items-center gap-1 text-xs">
                <MapPin className="size-3" />
                {result.city ?? "—"} {result.state ? `- ${result.state}` : ""}
              </div>
            </div>
          </div>
          <Badge variant="outline" className="shrink-0">
            {formatDistance(result.distanceKm)}
          </Badge>
        </CardContent>
      </Card>
    </Link>
  );
}

export function ProjectResultCard({
  result,
}: {
  result: NearbyDevelopmentResult;
}) {
  const potential = getPotentialFromScore(result.aiScore);

  return (
    <Link href={`/projects/${result.id}`}>
      <Card className="hover:border-primary/50 transition-colors">
        <CardContent className="flex items-start justify-between gap-3 pt-6">
          <div>
            <div className="font-medium">{result.name}</div>
            <div className="text-muted-foreground flex items-center gap-1 text-xs">
              <MapPin className="size-3" />
              {result.city ?? "—"} {result.state ? `- ${result.state}` : ""}
            </div>
            <div className="mt-2 flex flex-wrap gap-1.5">
              <Badge variant="outline">
                {CONSTRUCTION_STATUS_LABELS[result.status]}
              </Badge>
              <Badge variant="outline">
                {DEVELOPMENT_STANDARD_LABELS[result.standard]}
              </Badge>
              <Badge variant={potential.variant}>{potential.label}</Badge>
            </div>
          </div>
          <Badge variant="outline" className="shrink-0">
            {formatDistance(result.distanceKm)}
          </Badge>
        </CardContent>
      </Card>
    </Link>
  );
}
