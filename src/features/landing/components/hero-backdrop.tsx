// Fundo do hero: brilho de ouro atrás do celular, grade fina que some nas bordas e grão.
// Tudo decorativo e em CSS (styles.css: .hero-glow, .hero-grid, .hero-grain).
export function HeroBackdrop() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0">
      <div className="hero-grid absolute inset-0" />
      <div className="hero-glow absolute bottom-0 left-1/2 aspect-square w-[140%] -translate-x-1/2 translate-y-1/3 lg:top-1/2 lg:bottom-auto lg:left-[74%] lg:w-[70%] lg:-translate-y-1/2" />
      <div className="hero-grain absolute inset-0" />
    </div>
  );
}
