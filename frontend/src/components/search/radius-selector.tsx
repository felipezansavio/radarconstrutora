"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const RADIUS_OPTIONS = [5, 10, 25, 50, 100];

export function RadiusSelector({
  value,
  onChange,
}: {
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {RADIUS_OPTIONS.map((option) => (
        <Button
          key={option}
          type="button"
          size="sm"
          variant={value === option ? "default" : "outline"}
          className={cn("rounded-full")}
          onClick={() => onChange(option)}
        >
          {option} km
        </Button>
      ))}
    </div>
  );
}
