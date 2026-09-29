import { redirect } from "next/navigation";
import { Suspense } from "react";
import { LoginForm } from "@/components/admin/login-form";
import { getSession } from "@/server/auth/session";

export const metadata = { title: "Sign in" };

export default function LoginPage({ searchParams }: PageProps<"/admin/login">) {
  return (
    <main id="main" className="hairline-grid flex min-h-dvh items-center justify-center px-4 py-16">
      <div className="w-full max-w-sm">
        <p className="label mb-3">Admin</p>
        <h1 className="display mb-8 text-4xl">Sign in</h1>
        <Suspense fallback={<div className="skeleton h-64" />}>
          <LoginGate searchParams={searchParams} />
        </Suspense>
      </div>
    </main>
  );
}

async function LoginGate({ searchParams }: Pick<PageProps<"/admin/login">, "searchParams">) {
  if (await getSession()) redirect("/admin");
  const next = (await searchParams).next;
  return <LoginForm next={typeof next === "string" ? next : "/admin"} />;
}
