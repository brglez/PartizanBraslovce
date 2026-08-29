import type { Metadata } from "next";
import { Poppins, Inter } from "next/font/google";
import Link from "next/link";
import "./globals.css";
import { auth, signOut } from "@/auth";
import { HALL_NAME } from "@/lib/config";

const poppins = Poppins({
  variable: "--font-poppins",
  weight: ["600", "700", "800"],
  subsets: ["latin"],
});

const inter = Inter({
  variable: "--font-inter",
  weight: ["400", "500", "600"],
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: `Rezervacije | ${HALL_NAME}`,
  description:
    "Rezervirajte termin za badminton, odbojko ali košarko v telovadnici Partizan Braslovče.",
};

export default async function RootLayout({
  children,
}: LayoutProps<"/">) {
  const session = await auth();

  return (
    <html
      lang="sl"
      className={`${poppins.variable} ${inter.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-white text-ink">
        <header className="bg-navy text-text sticky top-0 z-50 shadow-lg shadow-navy/20">
          <div className="mx-auto max-w-5xl px-6 py-4 flex items-center justify-between gap-4">
            <Link href="/" className="flex items-center gap-2 font-head font-bold text-lg">
              <span aria-hidden>🏸</span>
              <span>
                Partizan <span className="text-accent">Braslovče</span>
              </span>
            </Link>
            <nav className="flex items-center gap-5 text-sm">
              <Link href="/" className="text-text-dim hover:text-text transition-colors">
                Koledar
              </Link>
              {session?.user?.role === "ADMIN" && (
                <Link href="/admin" className="text-text-dim hover:text-text transition-colors">
                  Admin
                </Link>
              )}
              {session?.user ? (
                <form
                  action={async () => {
                    "use server";
                    await signOut({ redirectTo: "/" });
                  }}
                >
                  <button className="rounded-full bg-accent px-4 py-2 font-semibold text-white hover:bg-accent-dark transition-colors">
                    Odjava ({session.user.name})
                  </button>
                </form>
              ) : (
                <Link
                  href="/prijava"
                  className="rounded-full bg-accent px-4 py-2 font-semibold text-white hover:bg-accent-dark transition-colors"
                >
                  Prijava
                </Link>
              )}
            </nav>
          </div>
        </header>
        <main className="flex-1 bg-[#f6f7fb]">{children}</main>
        <footer className="bg-navy text-text-dim text-center text-sm py-6">
          <p>
            &copy; {new Date().getFullYear()} Partizan Braslovče &middot;{" "}
            <a href="https://partizan-braslovce.si/" className="text-accent hover:underline">
              Nazaj na glavno stran
            </a>
          </p>
        </footer>
      </body>
    </html>
  );
}
