import Link from "next/link";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Admin Contacts | RealEstate",
  description: "Review contact form messages.",
};

export default async function AdminContactsPage() {
  const messages = await prisma.contactMessage.findMany({
    orderBy: { createdAt: "desc" },
  });

  return (
    <main className="min-h-screen bg-zinc-50">
      <section className="border-b border-zinc-200 bg-white">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-4 py-10 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm uppercase tracking-wide text-zinc-500">
              Admin
            </p>
            <h1 className="mt-2 text-3xl font-semibold text-zinc-900">
              Contact messages
            </h1>
            <p className="mt-2 text-sm text-zinc-600">
              Review incoming contact form submissions.
            </p>
          </div>
          <Link
            href="/admin"
            className="rounded-xl border border-zinc-200 px-5 py-3 text-sm font-semibold text-zinc-700"
          >
            Back to admin
          </Link>
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-4 py-10">
        {messages.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-zinc-200 bg-white p-10 text-center text-sm text-zinc-500">
            No contact messages yet.
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map(message => (
              <div
                key={message.id}
                className="rounded-2xl border border-zinc-200 bg-white p-6"
              >
                <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                  <div>
                    <p className="text-sm font-semibold text-zinc-900">
                      {message.subject}
                    </p>
                    <p className="text-xs text-zinc-500">
                      {message.name} · {message.email}
                    </p>
                  </div>
                  <span className="text-xs text-zinc-400">
                    {formatDate(message.createdAt)}
                  </span>
                </div>
                <p className="mt-3 text-sm text-zinc-600">{message.message}</p>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}

function formatDate(value: Date) {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(value);
}
