"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { signInAction, signUpAction } from "@/lib/actions/auth-actions";
import { Button, Card, ErrorBanner, Field, Input } from "@/components/ui/primitives";
import { useAction } from "@/components/ui/use-action";

export function AuthForm({ next, initialError, initialMode }: { next: string; initialError: string | null; initialMode: "signin" | "signup" }) {
  const [mode, setMode] = useState(initialMode);
  const [sentTo, setSentTo] = useState<string | null>(null);
  const { pending, error, fieldErrors, run, setError, setFieldErrors } = useAction();
  const router = useRouter();
  const shownError = error ?? initialError;

  if (sentTo)
    return (
      <Card className="space-y-3 p-6 text-center">
        <h1 className="text-lg font-semibold">Check your email</h1>
        <p className="text-sm text-slate-600">
          We sent a confirmation link to <strong>{sentTo}</strong>. Open it on this device to finish creating your account.
        </p>
        <Button variant="secondary" onClick={() => { setSentTo(null); setMode("signin"); }}>
          Back to sign in
        </Button>
      </Card>
    );

  const signup = mode === "signup";
  return (
    <Card className="p-6">
      <h1 className="mb-4 text-lg font-semibold">{signup ? "Create your account" : "Sign in"}</h1>
      <form
        noValidate
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          const form = new FormData(e.currentTarget);
          form.set("next", next);
          const email = String(form.get("email") ?? "");
          if (signup)
            run(() => signUpAction(form), (data) => {
              if (data?.next) {
                router.push(data.next);
                router.refresh();
              } else setSentTo(email);
            });
          else
            run(() => signInAction(form), (data) => {
              router.push(data?.next ?? "/");
              router.refresh();
            });
        }}
      >
        <ErrorBanner message={shownError} />
        <Field label="Email" error={fieldErrors.email}>
          <Input name="email" type="email" autoComplete="email" required autoFocus invalid={!!fieldErrors.email} />
        </Field>
        <Field label="Password" error={fieldErrors.password} hint={signup ? "At least 8 characters." : undefined}>
          <Input
            name="password"
            type="password"
            autoComplete={signup ? "new-password" : "current-password"}
            required
            invalid={!!fieldErrors.password}
          />
        </Field>
        <Button type="submit" className="w-full" disabled={pending}>
          {pending ? "Please wait…" : signup ? "Create account" : "Sign in"}
        </Button>
      </form>
      <p className="mt-4 text-center text-sm text-slate-600">
        {signup ? "Already have an account?" : "New here?"}{" "}
        <button
          type="button"
          className="font-medium text-teal-700 hover:underline"
          onClick={() => {
            setMode(signup ? "signin" : "signup");
            setError(null);
            setFieldErrors({});
          }}
        >
          {signup ? "Sign in" : "Create an account"}
        </button>
      </p>
    </Card>
  );
}
