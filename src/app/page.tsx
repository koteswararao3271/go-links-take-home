import { listLinks } from "@/lib/store";
import { LinksApp } from "@/components/LinksApp";

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ create?: string }>;
}) {
  const { create } = await searchParams;
  const initialLinks = listLinks();

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-8 px-6 py-10">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
          go links
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Internal shortcuts — visit{" "}
          <code className="rounded bg-slate-100 px-1 py-0.5 text-slate-700">
            go/&lt;slug&gt;
          </code>{" "}
          to jump straight to a destination.
        </p>
      </header>
      <LinksApp initialLinks={initialLinks} prefillSlug={create} />
    </main>
  );
}
