import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export const metadata = {
  title: "Admin Login | RealEstate",
  description: "Secure admin access for RealEstate.",
};

type PageProps = {
  searchParams?: {
    next?: string;
    error?: string;
  };
};

export default function AdminLoginPage({ searchParams }: PageProps) {
  const nextPath = searchParams?.next || "/admin";
  const hasToken = Boolean(process.env.ADMIN_ACCESS_TOKEN);
  const hasError = searchParams?.error === "1";

  async function signIn(formData: FormData) {
    "use server";

    const token = readString(formData, "token");
    const expected = process.env.ADMIN_ACCESS_TOKEN;

    if (!expected || token !== expected) {
      redirect(`/admin/login?error=1&next=${encodeURIComponent(nextPath)}`);
    }

    const store = await cookies();
    store.set("admin_token", token, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      secure: process.env.NODE_ENV === "production",
    });

    redirect(nextPath);
  }

  return (
    <main className="min-h-screen bg-zinc-50">
      <section className="border-b border-zinc-200 bg-white">
        <div className="mx-auto w-full max-w-3xl px-4 py-12">
          <p className="text-sm uppercase tracking-wide text-zinc-500">Admin</p>
          <h1 className="mt-2 text-4xl font-semibold text-zinc-900">Sign in</h1>
          <p className="mt-3 text-base text-zinc-600">
            Enter the admin access token to continue.
          </p>
        </div>
      </section>

      <section className="mx-auto w-full max-w-3xl px-4 py-12">
        <form
          className="rounded-2xl border border-zinc-200 bg-white p-6"
          action={signIn}
        >
          {!hasToken ? (
            <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
              Set ADMIN_ACCESS_TOKEN in your .env file to enable admin login.
            </div>
          ) : null}
          {hasError ? (
            <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              Invalid token. Please try again.
            </div>
          ) : null}
          <input type="hidden" name="next" value={nextPath} />
          <input
            name="token"
            type="password"
            placeholder="Admin access token"
            className="w-full rounded-xl border border-zinc-200 px-4 py-3 text-sm"
            required
          />
          <button
            type="submit"
            className="mt-4 w-full rounded-xl bg-zinc-900 px-4 py-3 text-sm font-semibold text-white"
          >
            Continue
          </button>
        </form>
      </section>
    </main>
  );
}

function readString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}
