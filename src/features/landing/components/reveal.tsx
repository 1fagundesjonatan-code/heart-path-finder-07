import { useEffect, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

const STAGGER_MS = 60;
const MAX_STAGGER = 3;

type Props = { children: ReactNode; className?: string; index?: number };

// Conteúdo nasce visível (SSR e sem JS). Só esconde o que ainda está abaixo da dobra
// e revela uma vez ao entrar 15% na tela.
export function Reveal({ children, className, index = 0 }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [state, setState] = useState<"shown" | "hidden">("shown");

  useEffect(() => {
    const el = ref.current;
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (el.getBoundingClientRect().top < window.innerHeight) return;

    setState("hidden");
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return;
        setState("shown");
        observer.disconnect();
      },
      { threshold: 0.15 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      data-state={state}
      className={cn("reveal", className)}
      style={{ transitionDelay: `${Math.min(index, MAX_STAGGER) * STAGGER_MS}ms` }}
    >
      {children}
    </div>
  );
}
