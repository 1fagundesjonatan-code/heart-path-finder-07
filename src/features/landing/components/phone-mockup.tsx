import type { CSSProperties } from "react";
import { cn } from "@/lib/utils";
import type { ScreenId } from "../content";
import { AppScreen } from "./app-screens";

const PHONE_SRC = "/images/hero-phone.png";
const PHONE_WIDTH = 887;
const PHONE_HEIGHT = 1774;

// Área da tela (transparente no PNG), em % da caixa da imagem. O raio é relativo à própria
// área (13.812% / 6.472% dá o mesmo valor em px nos dois eixos). Trocou o render? Ajuste aqui.
const SCREEN_AREA = { left: 9.132, top: 6.483, width: 81.623, height: 87.091 };
const SCREEN_RADIUS = "13.812% / 6.472%";
// Folga pra não aparecer fresta entre a tela HTML e a moldura.
const SCREEN_BLEED = 0.2;

const screenStyle: CSSProperties = {
  left: `${SCREEN_AREA.left - SCREEN_BLEED}%`,
  top: `${SCREEN_AREA.top - SCREEN_BLEED}%`,
  width: `${SCREEN_AREA.width + SCREEN_BLEED * 2}%`,
  height: `${SCREEN_AREA.height + SCREEN_BLEED * 2}%`,
  borderRadius: SCREEN_RADIUS,
};

type Props = {
  screens: readonly ScreenId[];
  active?: number;
  className?: string;
  priority?: boolean;
};

// Decorativo: o conteúdo de cada tela também está no texto ao lado.
export function PhoneMockup({ screens, active = 0, className, priority = false }: Props) {
  return (
    <div aria-hidden="true" className={cn("relative aspect-[1/2] w-full", className)}>
      {/* Sombra num elemento próprio: drop-shadow no PNG recorta num retângulo visível. */}
      <div className="absolute inset-x-[6%] inset-y-[5%] rounded-[14%/7%] shadow-[0_2px_4px_oklch(0.14_0_0/8%),0_40px_80px_-24px_oklch(0.14_0_0/35%)]" />
      <div className="absolute overflow-hidden bg-background text-foreground" style={screenStyle}>
        {screens.map((id, i) => (
          <div
            key={id}
            className={cn(
              "absolute inset-0 pt-[2%] transition-opacity duration-300 motion-reduce:transition-none",
              i === active ? "opacity-100" : "opacity-0",
            )}
          >
            <AppScreen id={id} />
          </div>
        ))}
      </div>
      <img
        src={PHONE_SRC}
        width={PHONE_WIDTH}
        height={PHONE_HEIGHT}
        alt=""
        draggable={false}
        loading={priority ? "eager" : "lazy"}
        decoding="async"
        className="pointer-events-none relative h-full w-full select-none"
      />
    </div>
  );
}
