import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-8 bg-[var(--background)] px-6">
      <div className="text-center max-w-sm">
        <h1 className="text-2xl font-bold text-[var(--foreground)] mb-2">
          Your luach… in the cloud.
        </h1>
        <p className="text-sm text-[var(--muted-foreground)] leading-relaxed">
          Luach stores your events, settings, and holiday preferences on our servers
          so they're available on any device, any time. An account is what ties it all together.
        </p>
      </div>
      <SignIn />
    </div>
  );
}
