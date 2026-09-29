"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { submitContact, type ContactState } from "@/server/actions/contact";
import { cn } from "@/lib/utils";

const initial: ContactState = { status: "idle" };

function Field({
  id,
  label,
  error,
  children,
}: {
  id: string;
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={id} className="label text-ink-2">
        {label}
      </label>
      {children}
      {error ? (
        <p id={`${id}-error`} className="text-sm text-experimental">
          {error}
        </p>
      ) : null}
    </div>
  );
}

const inputClass = (invalid: boolean) =>
  cn(
    "w-full rounded-md border bg-surface px-4 text-base transition-colors placeholder:text-ink-3 focus:outline-none",
    invalid ? "border-experimental" : "border-line focus:border-ink",
  );

export function ContactForm() {
  const [state, action, pending] = useActionState(submitContact, initial);

  if (state.status === "success") {
    return (
      <div role="status" className="flex flex-col items-start gap-4 rounded-lg border border-line bg-surface p-8">
        <span className="inline-flex size-10 items-center justify-center rounded-full bg-live/15 text-live">
          <Icon name="check" size={20} />
        </span>
        <p className="display text-3xl">Message sent.</p>
        <p className="text-ink-2">{state.message}</p>
      </div>
    );
  }

  const errors = state.fieldErrors ?? {};
  return (
    <form action={action} className="flex flex-col gap-6" noValidate>
      {state.status === "error" && state.message ? (
        <p role="alert" className="rounded-md border border-experimental/40 bg-experimental/5 px-4 py-3 text-sm text-experimental">
          {state.message}
        </p>
      ) : null}

      <div className="grid gap-6 sm:grid-cols-2">
        <Field id="name" label="Name" error={errors.name}>
          <input
            id="name"
            name="name"
            autoComplete="name"
            required
            maxLength={120}
            defaultValue={state.values?.name}
            aria-invalid={Boolean(errors.name)}
            aria-describedby={errors.name ? "name-error" : undefined}
            className={cn(inputClass(Boolean(errors.name)), "h-12")}
          />
        </Field>
        <Field id="email" label="Email" error={errors.email}>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            maxLength={200}
            defaultValue={state.values?.email}
            aria-invalid={Boolean(errors.email)}
            aria-describedby={errors.email ? "email-error" : undefined}
            className={cn(inputClass(Boolean(errors.email)), "h-12")}
          />
        </Field>
      </div>
      <Field id="subject" label="Subject (optional)">
        <input id="subject" name="subject" maxLength={160} defaultValue={state.values?.subject} className={cn(inputClass(false), "h-12")} />
      </Field>
      <Field id="message" label="Message" error={errors.message}>
        <textarea
          id="message"
          name="message"
          required
          rows={7}
          maxLength={5000}
          defaultValue={state.values?.message}
          aria-invalid={Boolean(errors.message)}
          aria-describedby={errors.message ? "message-error" : undefined}
          className={cn(inputClass(Boolean(errors.message)), "resize-y py-3 leading-relaxed")}
        />
      </Field>

      {/* Honeypot: hidden from people and assistive tech, irresistible to bots. */}
      <div aria-hidden className="absolute -left-[9999px] h-px w-px overflow-hidden">
        <label htmlFor="website">Website</label>
        <input id="website" name="website" tabIndex={-1} autoComplete="off" />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4">
        <p className="text-sm text-ink-3">Stored privately; only used to reply to you.</p>
        <Button type="submit" variant="accent" size="lg" trailingIcon="arrow-right" disabled={pending} aria-busy={pending}>
          {pending ? "Sending…" : "Send message"}
        </Button>
      </div>
    </form>
  );
}
