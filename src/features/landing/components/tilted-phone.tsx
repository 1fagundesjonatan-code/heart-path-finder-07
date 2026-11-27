import type { Ref } from "react";
import { cn } from "@/lib/utils";
import type { ScreenId } from "../content";
import { PhoneMockup } from "./phone-mockup";

const EDGE_LAYERS = 14;
const EDGE_STEP_PX = 1.5;

type Props = {
  screens: readonly ScreenId[];
  active?: number;
  tiltRef?: Ref<HTMLDivElement>;
  className?: string;
  priority?: boolean;
};

// Um único celular (PNG frontal) inclinado por CSS 3D. A espessura vem de camadas de borda
// empilhadas atrás do PNG: ficam escondidas quando o celular está reto e aparecem na lateral
// conforme ele inclina. A pose inicial está em .phone-tilt (styles.css).
export function TiltedPhone({ screens, active = 0, tiltRef, className, priority }: Props) {
  return (
    <div className={cn("[perspective:1600px]", className)}>
      <div ref={tiltRef} className="phone-tilt relative will-change-transform">
        {Array.from({ length: EDGE_LAYERS }, (_, i) => (
          <div
            key={i}
            className="absolute inset-x-[2.4%] inset-y-[0.8%] rounded-[12.5%/6.3%]"
            style={{
              transform: `translateZ(${-(i + 1) * EDGE_STEP_PX}px)`,
              background: `oklch(${0.74 - i * 0.012} 0.08 78)`,
            }}
          />
        ))}
        <PhoneMockup screens={screens} active={active} priority={priority} />
      </div>
    </div>
  );
}
