import { ptBR } from "date-fns/locale";
import { CalendarDays } from "lucide-react";
import { useState } from "react";
import type { DateRange } from "react-day-picker";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  BUSINESS_TIME_ZONE,
  PERIOD_PRESETS,
  PRESET_LABELS,
  formatYmd,
  validateCustomRange,
  type CustomRange,
  type PeriodPreset,
  type ResolvedPeriod,
} from "../domain/period";

type Props = {
  preset: PeriodPreset;
  period: ResolvedPeriod;
  onPresetChange: (preset: Exclude<PeriodPreset, "custom">) => void;
  onCustomChange: (range: CustomRange) => void;
};

function localDateToYmd(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

export function PeriodFilter({ preset, period, onPresetChange, onCustomChange }: Props) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<DateRange | undefined>();
  const [rangeError, setRangeError] = useState<string | null>(null);

  const handleSelect = (range: DateRange | undefined) => {
    setDraft(range);
    setRangeError(null);
    if (range?.from && range.to) {
      const custom = { from: localDateToYmd(range.from), to: localDateToYmd(range.to) };
      const error = validateCustomRange(custom);
      if (error) {
        setRangeError(error);
        return;
      }
      onCustomChange(custom);
      setOpen(false);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <ToggleGroup
          type="single"
          value={preset === "custom" ? "" : preset}
          onValueChange={(value) => {
            if (value) onPresetChange(value as Exclude<PeriodPreset, "custom">);
          }}
          aria-label="Período"
          className="flex-wrap justify-start"
        >
          {PERIOD_PRESETS.filter((p) => p !== "custom").map((p) => (
            <ToggleGroupItem
              key={p}
              value={p}
              variant="outline"
              className="min-h-10 px-4 data-[state=on]:border-foreground data-[state=on]:bg-foreground data-[state=on]:text-background"
            >
              {PRESET_LABELS[p]}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>

        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              aria-pressed={preset === "custom"}
              className={
                preset === "custom"
                  ? "min-h-10 border-foreground bg-foreground text-background hover:bg-foreground/90 hover:text-background"
                  : "min-h-10"
              }
            >
              <CalendarDays aria-hidden="true" />
              {PRESET_LABELS.custom}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="range"
              locale={ptBR}
              numberOfMonths={2}
              selected={draft}
              onSelect={handleSelect}
              disabled={{ after: new Date() }}
            />
            {rangeError ? (
              <p role="alert" className="border-t border-border px-4 py-2 text-xs text-destructive">
                {rangeError}
              </p>
            ) : (
              <p className="border-t border-border px-4 py-2 text-xs text-muted-foreground">
                Escolha o primeiro e o último dia.
              </p>
            )}
          </PopoverContent>
        </Popover>
      </div>

      <p className="text-xs text-muted-foreground">
        {formatYmd(period.firstDay)} a {formatYmd(period.lastDay)} · fuso {BUSINESS_TIME_ZONE}
      </p>
    </div>
  );
}
