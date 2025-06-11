import { GroupForm } from "./_components/GroupForm";
import { ExpenseForm } from "./_components/ExpenseForm";
import { GroupSummary } from "./_components/GroupSummary";
import { api } from "~/trpc/server";
import type { RouterOutputs } from "~/trpc/shared";
import { auth } from "~/server/auth";
import Link from "next/link";

type Group = RouterOutputs["group"]["getAll"][number];

export default async function HomePage() {
  const session = await auth();

  if (!session?.user) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center">
        <div className="container flex flex-col items-center justify-center gap-12 px-4 py-16">
          <h1 className="text-4xl font-bold">Welcome to Splitwise Clone</h1>
          <p className="text-xl text-muted-foreground">
            Sign in to start managing your expenses
          </p>
          <Link
            href="/api/auth/signin"
            className="rounded-full bg-primary px-8 py-3 font-semibold text-primary-foreground no-underline transition hover:bg-primary/90"
          >
            Sign in with Google
          </Link>
        </div>
      </main>
    );
  }

  const groups = await api.group.getAll();

  return (
    <main className="container mx-auto p-4">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-3xl font-bold">Splitwise Clone</h1>
        <Link
          href="/api/auth/signout"
          className="rounded-full bg-primary/10 px-4 py-2 font-semibold text-primary no-underline transition hover:bg-primary/20"
        >
          Sign out
        </Link>
      </div>

      <div className="grid gap-8 md:grid-cols-2">
        <div>
          <h2 className="mb-8 text-2xl font-bold">Create New Group</h2>
          <GroupForm />
        </div>

        {groups.length > 0 && (
          <div>
            <h2 className="mb-8 text-2xl font-bold">Add Expense</h2>
            {groups.map((group: Group) => (
              <div key={group.id} className="mb-8">
                <h3 className="mb-4 text-xl font-semibold">{group.name}</h3>
                <ExpenseForm
                  groupId={group.id}
                  people={group.people}
                />
              </div>
            ))}
          </div>
        )}
      </div>

      {groups.length > 0 && (
        <div className="mt-12">
          <h2 className="mb-8 text-2xl font-bold">Group Summaries</h2>
          <div className="grid gap-8 md:grid-cols-2">
            {groups.map((group: Group) => (
              <div key={group.id}>
                <h3 className="mb-4 text-xl font-semibold">{group.name}</h3>
                <GroupSummary group={group} />
              </div>
            ))}
          </div>
        </div>
      )}
    </main>
  );
}
