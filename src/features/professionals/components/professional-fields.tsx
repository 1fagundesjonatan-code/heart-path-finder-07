import { useFormContext } from "react-hook-form";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { BR_STATES, MAX_SPECIALTIES, REGISTRY_COUNCILS, type ProfessionalFields } from "../schemas";
import { TagsInput } from "./tags-input";

export const COUNCIL_LABELS: Record<(typeof REGISTRY_COUNCILS)[number], string> = {
  CRP: "CRP (Psicologia)",
  CRM: "CRM (Medicina)",
  OTHER: "Outro conselho",
};

/** Campos compartilhados entre o convite e a edição da ficha. */
export function ProfessionalFormFields({ disabled }: { disabled?: boolean }) {
  const { control } = useFormContext<ProfessionalFields>();
  return (
    <>
      <FormField
        control={control}
        name="fullName"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Nome completo</FormLabel>
            <FormControl>
              <Input autoComplete="off" maxLength={120} disabled={disabled} {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <div className="grid gap-4 sm:grid-cols-[1fr_1fr_6rem]">
        <FormField
          control={control}
          name="registryCouncil"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Conselho</FormLabel>
              <Select value={field.value} onValueChange={field.onChange} disabled={disabled}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {REGISTRY_COUNCILS.map((council) => (
                    <SelectItem key={council} value={council}>
                      {COUNCIL_LABELS[council]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={control}
          name="registryNumber"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Número do registro</FormLabel>
              <FormControl>
                <Input autoComplete="off" maxLength={20} disabled={disabled} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={control}
          name="registryState"
          render={({ field }) => (
            <FormItem>
              <FormLabel>UF</FormLabel>
              <Select value={field.value} onValueChange={field.onChange} disabled={disabled}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="UF" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {BR_STATES.map((uf) => (
                    <SelectItem key={uf} value={uf}>
                      {uf}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
      <FormField
        control={control}
        name="specialties"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Especialidades (até {MAX_SPECIALTIES})</FormLabel>
            <FormControl>
              <TagsInput value={field.value} onChange={field.onChange} max={MAX_SPECIALTIES} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={control}
        name="bio"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Bio (opcional)</FormLabel>
            <FormControl>
              <Textarea rows={4} maxLength={2000} disabled={disabled} {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </>
  );
}
