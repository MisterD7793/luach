"use client";

import { useRouter } from "next/navigation";

export default function Footer() {
  const router = useRouter();

  return (
    <footer className="flex justify-center gap-5 px-4 py-5 border-t border-[var(--border)] mt-auto">
      {[
        { label: "About", path: "/about" },
        { label: "Coming soon", path: "/future" },
        { label: "Version history", path: "/changelog" },
      ].map(({ label, path }) => (
        <button
          key={path}
          onClick={() => router.push(path)}
          className="text-xs text-[var(--muted-foreground)] underline min-h-[auto] min-w-[auto]"
        >
          {label}
        </button>
      ))}
    </footer>
  );
}
