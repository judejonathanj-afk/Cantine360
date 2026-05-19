import { Suspense } from "react";
import { LoginClient } from "./ui";

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-1 items-center justify-center bg-background px-6 py-12">
          <div className="w-full max-w-sm rounded-2xl border border-border/50 bg-card/80 p-6 shadow-sm backdrop-blur-sm">
            <div className="h-5 w-24 rounded bg-muted" />
            <div className="mt-3 h-4 w-64 rounded bg-muted" />
            <div className="mt-6 h-12 rounded-xl bg-muted" />
          </div>
        </div>
      }
    >
      <LoginClient />
    </Suspense>
  );
}

