"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { login, type LoginState } from "@/server/actions/auth";

export function LoginForm({ next }: { next: string }) {
  const [state, action, pending] = useActionState<LoginState, FormData>(login, {});

  return (
    <form action={action} className="flex flex-col gap-5 rounded-lg border border-line bg-surface p-6">
      <input type="hidden" name="next" value={next} />
      {state.error ? (
        <p role="alert" className="rounded-md border border-experimental/40 bg-experimental/5 px-3 py-2 text-sm text-experimental">
          {state.error}
        </p>
      ) : null}
      <label className="flex flex-col gap-2">
        <span className="label text-ink-2">Email</span>
        <input
          name="email"
          type="email"
          autoComplete="username"
          required
          defaultValue={state.email}
          className="h-11 rounded-md border border-line bg-paper px-3 focus:border-ink focus:outline-none"
        />
      </label>
      <label className="flex flex-col gap-2">
        <span className="label text-ink-2">Password</span>
        <input
          name="password"
          type="password"
          autoComplete="current-password"
          required
          className="h-11 rounded-md border border-line bg-paper px-3 focus:border-ink focus:outline-none"
        />
      </label>
      <Button type="submit" size="lg" disabled={pending} aria-busy={pending}>
        {pending ? "Signing in…" : "Sign in"}
      </Button>
    </form>
  );
}
