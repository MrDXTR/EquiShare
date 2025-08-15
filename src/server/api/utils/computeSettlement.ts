import { TRPCError } from "@trpc/server";
import type {
	PrismaClient,
	Person,
	Expense,
	Share,
	Settlement,
} from "@prisma/client";

type Ctx = {
	db: PrismaClient;
	session: { user: { id: string } };
};

// Compute minimal transfers needed to settle balances
function minTx(
	rows: { id: string; name: string; bal: number }[],
): { fromId: string; toId: string; amount: number }[] {
	const creditors = rows.filter((r) => r.bal > 0).map((r) => ({ ...r }));
	const debtors = rows.filter((r) => r.bal < 0).map((r) => ({ ...r }));
	const tx: { fromId: string; toId: string; amount: number }[] = [];

	let i = 0,
		j = 0;
	while (i < debtors.length && j < creditors.length) {
		const d = debtors[i];
		const c = creditors[j];
		if (!d || !c) break;
		const amt = Math.min(-d.bal, c.bal);
		if (amt > 0.009) {
			tx.push({ fromId: d.id, toId: c.id, amount: amt });
			d.bal += amt;
			c.bal -= amt;
		}
		if (Math.abs(d.bal) < 0.009) i++;
		if (Math.abs(c.bal) < 0.009) j++;
	}
	return tx;
}

export async function computeAndUpsertSettlements(ctx: Ctx, groupId: string) {
	// Access check
	const ok = await ctx.db.group.findFirst({
		where: {
			id: groupId,
			OR: [
				{ createdById: ctx.session.user.id },
				{ members: { some: { id: ctx.session.user.id } } },
			],
		},
		select: { id: true },
	});
	if (!ok) {
		throw new TRPCError({ code: "FORBIDDEN", message: "No access" });
	}

	// Load group, expenses, and settlements
	const g = await ctx.db.group.findUnique({
		where: { id: groupId },
		include: {
			people: true,
			expenses: {
				include: {
					paidBy: true,
					shares: { include: { person: true } },
				},
				orderBy: { createdAt: "asc" },
			},
			settlements: true,
		},
	});
	if (!g) throw new TRPCError({ code: "NOT_FOUND" });

	// Build balances from expenses
	const bal = new Map<string, number>();
	g.people.forEach((p) => bal.set(p.id, 0));

	type X = Expense & { shares: (Share & { person: Person })[] };
	g.expenses.forEach((e: X) => {
		bal.set(e.paidById, (bal.get(e.paidById) ?? 0) + e.amount);
		e.shares.forEach((s) =>
			bal.set(s.personId, (bal.get(s.personId) ?? 0) - s.amount),
		);
	});

	// Apply settled transfers (already paid)
	g.settlements
		.filter((s) => s.settled)
		.forEach((s: Settlement) => {
			bal.set(s.fromId, (bal.get(s.fromId) ?? 0) + s.amount);
			bal.set(s.toId, (bal.get(s.toId) ?? 0) - s.amount);
		});

	// Compute minimal new transfers
	const rows = Array.from(bal.entries())
		.filter(([, v]) => Math.abs(v) > 0.01)
		.map(([id, v]) => ({ id, name: g.people.find((p) => p.id === id)!.name, bal: v }));

	const newTx = minTx(rows).map((t) => ({
		...t,
		amount: Math.round(t.amount * 100) / 100,
	}));

	// Recreate all unsettled rows from scratch
	// Pick a recent relevant expense for each pair so the UI has context
	const pairToLatestExpense = new Map<string, string>();
	g.expenses.forEach((expense) => {
		const { paidById } = expense;
		expense.shares.forEach((share) => {
			if (share.personId !== paidById) {
				const pairKey = `${share.personId}-${paidById}`;
				pairToLatestExpense.set(pairKey, expense.id);
			}
		});
	});

	await ctx.db.$transaction(async (tx) => {
		await tx.settlement.deleteMany({ where: { groupId, settled: false } });

		if (newTx.length) {
			const data = newTx.map((t) => {
				const pairKey = `${t.fromId}-${t.toId}`;
				const expenseId =
					pairToLatestExpense.get(pairKey) || g.expenses[g.expenses.length - 1]?.id;

				if (!expenseId) {
					throw new TRPCError({
						code: "INTERNAL_SERVER_ERROR",
						message: "Could not find a valid expense for settlement",
					});
				}

				return {
					groupId,
					fromId: t.fromId,
					toId: t.toId,
					amount: t.amount,
					settled: false,
					expenseId,
				};
			});

			if (data.length) {
				await tx.settlement.createMany({ data });
			}
		}

		const sums = await tx.settlement.groupBy({
			by: ["expenseId"],
			where: { groupId, settled: true },
			_sum: { amount: true },
		});

		const sumMap = new Map<string, number>();
		sums.forEach((s) => {
			sumMap.set(s.expenseId, Number(s._sum.amount ?? 0));
		});

		const expenseUpdatePromises = g.expenses.map((exp) =>
			tx.expense.update({
				where: { id: exp.id },
				data: { settledAmount: sumMap.get(exp.id) ?? 0 },
			}),
		);

		if (expenseUpdatePromises.length) {
			await Promise.all(expenseUpdatePromises);
		}
	});

	return { success: true, newUnsettled: newTx.length };
}
