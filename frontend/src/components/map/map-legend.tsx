import { MAP_LEGEND_ITEMS } from "@/lib/map-markers";

export function MapLegend() {
  return (
    <div className="bg-background/95 flex flex-wrap gap-x-4 gap-y-2 rounded-lg border p-3 text-xs shadow-sm backdrop-blur">
      {MAP_LEGEND_ITEMS.map((item) => (
        <div key={item.label} className="flex items-center gap-1.5">
          <span
            className="size-2.5 shrink-0 rounded-full"
            style={{ backgroundColor: item.color }}
            aria-hidden
          />
          <span className="text-muted-foreground">{item.label}</span>
        </div>
      ))}
    </div>
  );
}
