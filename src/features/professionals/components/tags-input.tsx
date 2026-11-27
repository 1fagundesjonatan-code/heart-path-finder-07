import { X } from "lucide-react";
import { useState, type KeyboardEvent } from "react";
import { Input } from "@/components/ui/input";

type Props = {
  id?: string;
  value: string[];
  onChange: (next: string[]) => void;
  max: number;
  "aria-describedby"?: string;
  "aria-invalid"?: boolean;
};

export function TagsInput({ id, value, onChange, max, ...aria }: Props) {
  const [draft, setDraft] = useState("");

  const commit = () => {
    const tag = draft.trim();
    setDraft("");
    if (!tag || value.length >= max) return;
    if (value.some((t) => t.toLowerCase() === tag.toLowerCase())) return;
    onChange([...value, tag]);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter" || event.key === ",") {
      event.preventDefault();
      commit();
    } else if (event.key === "Backspace" && !draft && value.length > 0) {
      onChange(value.slice(0, -1));
    }
  };

  return (
    <div className="space-y-2">
      {value.length > 0 && (
        <ul className="flex flex-wrap gap-2">
          {value.map((tag) => (
            <li
              key={tag}
              className="inline-flex items-center gap-1 rounded-full border border-border py-0.5 pl-3 pr-1 text-xs"
            >
              {tag}
              <button
                type="button"
                onClick={() => onChange(value.filter((t) => t !== tag))}
                aria-label={`Remover especialidade ${tag}`}
                className="grid size-6 place-items-center rounded-full text-muted-foreground hover:bg-secondary hover:text-foreground focus-visible:outline-2 focus-visible:outline-foreground"
              >
                <X aria-hidden="true" className="size-3" />
              </button>
            </li>
          ))}
        </ul>
      )}
      <Input
        id={id}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={commit}
        disabled={value.length >= max}
        placeholder={value.length >= max ? `Limite de ${max} atingido` : "Digite e tecle Enter"}
        maxLength={60}
        {...aria}
      />
    </div>
  );
}
