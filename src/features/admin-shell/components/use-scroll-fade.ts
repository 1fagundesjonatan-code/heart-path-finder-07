import { useEffect, useRef } from "react";

/** Liga data-fade-top/bottom no elemento conforme haja conteúdo cortado em cada borda. */
export function useScrollFade<T extends HTMLElement>() {
  const ref = useRef<T>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let frame = 0;
    const update = () => {
      frame = 0;
      el.dataset.fadeTop = String(el.scrollTop > 1);
      el.dataset.fadeBottom = String(el.scrollTop + el.clientHeight < el.scrollHeight - 1);
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    el.addEventListener("scroll", schedule, { passive: true });
    const observer = new ResizeObserver(schedule);
    observer.observe(el);
    if (el.firstElementChild) observer.observe(el.firstElementChild);
    return () => {
      el.removeEventListener("scroll", schedule);
      observer.disconnect();
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);

  return ref;
}
