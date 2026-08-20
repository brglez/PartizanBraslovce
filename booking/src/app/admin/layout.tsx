import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/auth";

export default async function AdminLayout({ children }: LayoutProps<"/admin">) {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") {
    redirect("/prijava");
  }

  return (
    <div className="mx-auto max-w-5xl px-6 py-10">
      <div className="mb-6 flex items-center gap-4 border-b border-border pb-4">
        <h1 className="font-head text-2xl font-extrabold text-navy mr-auto">Admin</h1>
        <nav className="flex gap-4 text-sm font-semibold">
          <Link href="/admin" className="text-ink-dim hover:text-accent transition-colors">
            Pregled
          </Link>
          <Link href="/admin/koledar" className="text-ink-dim hover:text-accent transition-colors">
            Koledar
          </Link>
          <Link href="/admin/clani" className="text-ink-dim hover:text-accent transition-colors">
            Člani
          </Link>
        </nav>
      </div>
      {children}
    </div>
  );
}
