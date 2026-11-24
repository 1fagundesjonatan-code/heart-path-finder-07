import { Link, createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [{ title: "The Self Institute | Autoconhecimento como competência para viver" }],
  }),
  component: HomePlaceholder,
});

// shortcut: placeholder until the redesigned landing page lands.
function HomePlaceholder() {
  return (
    <main className="grain grid min-h-screen place-items-center px-6 py-16">
      <div className="text-center">
        <h1 className="font-serif text-6xl leading-none md:text-7xl">The Self</h1>
        <Link
          to="/eneagrama"
          className="mt-10 inline-flex min-h-12 items-center rounded-full bg-primary px-7 py-3.5 text-sm font-medium uppercase tracking-[0.16em] text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground"
        >
          Fazer o teste
        </Link>
      </div>
    </main>
  );
}
