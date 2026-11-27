import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { types } from "@/data/enneagram";
import type { ChatVersionOption } from "../../chat-types";

const NO_TYPE = "none";

const STATUS_LABEL: Record<ChatVersionOption["status"], string> = {
  draft: "rascunho",
  active: "ativa",
  archived: "arquivada",
};

function versionLabel(version: ChatVersionOption): string {
  const name = version.label ? ` · ${version.label}` : "";
  return `v${version.version}${name} (${STATUS_LABEL[version.status]})`;
}

type Props = {
  versions: ChatVersionOption[];
  versionId: number;
  simulatedType: number | null;
  onVersionChange: (versionId: number) => void;
  onTypeChange: (simulatedType: number | null) => void;
};

export function ChatControls({
  versions,
  versionId,
  simulatedType,
  onVersionChange,
  onTypeChange,
}: Props) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <div className="space-y-1.5">
        <Label htmlFor="chat-version">Versão da persona</Label>
        <Select value={String(versionId)} onValueChange={(value) => onVersionChange(Number(value))}>
          <SelectTrigger id="chat-version" className="min-h-11 w-full">
            <SelectValue placeholder="Escolha a versão" />
          </SelectTrigger>
          <SelectContent>
            {versions.map((version) => (
              <SelectItem key={version.id} value={String(version.id)}>
                {versionLabel(version)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="chat-type">Simular tipo do Eneagrama</Label>
        <Select
          value={simulatedType === null ? NO_TYPE : String(simulatedType)}
          onValueChange={(value) => onTypeChange(value === NO_TYPE ? null : Number(value))}
        >
          <SelectTrigger id="chat-type" className="min-h-11 w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={NO_TYPE}>Não informado</SelectItem>
            {Object.entries(types).map(([key, type]) => (
              <SelectItem key={key} value={key}>
                {type.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
