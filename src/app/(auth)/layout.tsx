import { ScanText } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center px-6 py-12">
      <div className="flex w-full max-w-sm flex-col gap-6">
        <header className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
              <ScanText className="size-5" />
            </span>
            <div className="flex flex-col gap-0.5">
              <h1 className="text-xl font-semibold tracking-tight">DocScan</h1>
              <p className="text-sm text-muted-foreground">
                Extraction de données depuis vos PDF
              </p>
            </div>
          </div>
          <ThemeToggle />
        </header>
        {children}
      </div>
    </main>
  );
}
