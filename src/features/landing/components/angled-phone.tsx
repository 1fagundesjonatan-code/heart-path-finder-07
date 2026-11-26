import { useLayoutEffect, useRef, useState, type CSSProperties } from "react";
import { cn } from "@/lib/utils";
import type { ScreenId } from "../content";
import { rectToQuadMatrix3d, type Point, type Quad } from "../lib/homography";
import { AppScreen } from "./app-screens";

const PHONE_SRC = "/images/hero-phone-angled.png";
const PHONE_WIDTH = 656;
const PHONE_HEIGHT = 1409;
// Tela HTML desenhada num retângulo de celular e projetada nos 4 cantos da tela do PNG.
const SCREEN_WIDTH = 390;
const SCREEN_HEIGHT = 844;
// Cantos da tela (transparente no PNG), em % da imagem: TL, TR, BR, BL.
const SCREEN_CORNERS: Quad = [
  [11.078, 9.094],
  [89.056, 0.814],
  [86.382, 97.305],
  [2.734, 97.656],
];
// Folga pra fora em cada canto (% da imagem), pra não aparecer fresta na moldura.
const SCREEN_BLEED = 0.5;
const BLEED_DIRECTION: Quad = [
  [-1, -1],
  [1, -1],
  [1, 1],
  [-1, 1],
];

function screenTransform(width: number): string {
  const height = (width * PHONE_HEIGHT) / PHONE_WIDTH;
  const corner = (i: 0 | 1 | 2 | 3): Point => {
    const [x, y] = SCREEN_CORNERS[i];
    const [dx, dy] = BLEED_DIRECTION[i];
    return [((x + dx * SCREEN_BLEED) / 100) * width, ((y + dy * SCREEN_BLEED) / 100) * height];
  };
  const quad: Quad = [corner(0), corner(1), corner(2), corner(3)];
  return rectToQuadMatrix3d(SCREEN_WIDTH, SCREEN_HEIGHT, quad);
}

type Props = { screen: ScreenId; className?: string };

// Celular em 3/4 da hero (decorativo). A pose já é 3D no render; nada de rotação em CSS.
export function AngledPhone({ screen, className }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) => {
      if (entry) setWidth(entry.contentRect.width);
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const screenStyle: CSSProperties = {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    transformOrigin: "0 0",
    transform: width ? screenTransform(width) : undefined,
    borderRadius: "12% / 5.5%",
  };

  return (
    <div ref={ref} aria-hidden="true" className={cn("relative", className)}>
      <div
        className={cn(
          "absolute left-0 top-0 overflow-hidden bg-background pt-2 text-foreground",
          !width && "invisible",
        )}
        style={screenStyle}
      >
        <AppScreen id={screen} />
      </div>
      <img
        src={PHONE_SRC}
        width={PHONE_WIDTH}
        height={PHONE_HEIGHT}
        alt=""
        draggable={false}
        decoding="async"
        fetchPriority="high"
        className="pointer-events-none relative h-auto w-full select-none"
      />
    </div>
  );
}
