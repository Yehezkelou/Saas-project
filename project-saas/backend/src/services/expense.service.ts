import prisma from "../lib/prisma";
import type { createExpenseInput, updtatExpenseInput } from "../validators/expense.validator";
import type { ExpenseCategory } from "../../generated/prisma/enums";





export class ExpenseService {


    // liste des depense 
    async list(tenantId : string, cycleId : string){
        return await prisma.expense.findMany({
            where : {tenantId, cycleId},
            orderBy : {
                createdAt : "desc"
            }
        })
    }


    // creer une depense 
    async create(tenantId: string , data : createExpenseInput){
        // verification 
        const cycle = await prisma.cycle.findFirst({
            where : {
                id : data.cycleId,
                tenantId,
                status : "OPEN"
            }
        })
        if(!cycle) throw new Error("CYCLE_NOT_FOUND_OR_CLOSED");

        return await prisma.expense.create({
            data : {
                tenantId,
                amount : data.amount,
                description : data.description,
                cycleId  : data.cycleId,
                imageUrl : data.imageUrl ?? null,
                category : data.category as ExpenseCategory
            }
        })
    }


    // mettre a jour une depense 
    async update(tenantId : string, expenseId : string, data : updtatExpenseInput){
        // verification
        const existing = await prisma.expense.findFirst({
            where : {tenantId, id : expenseId},
            include : {cycle : true}
        })

        if(!existing) throw new Error("EXPENSE_NOT_FOUND");

        // on peut modifier unde que si le cyle est ouvert
        if(existing.cycle.status == "CLOSED") throw new Error("CYCLE_CLOSED");

        return await prisma.expense.update({
            where : {tenantId, id : expenseId},
            data : {
                amount : data.amount!,
                description : data.description!,
                category : data.category as ExpenseCategory
            }
        })
    }

      // ── Supprimer une dépense ──────────────────────────────────
    async delete(tenantId: string, expenseId: string) {
        const expense = await prisma.expense.findFirst({
            where: { id: expenseId, tenantId },
            include: { cycle: true },
        });
        if (!expense) throw new Error("EXPENSE_NOT_FOUND");
        if (expense.cycle.status === "CLOSED") throw new Error("CYCLE_CLOSED");
 
    await prisma.expense.delete({ where: { id: expenseId } });
  }
 
     // ── Total des dépenses par catégorie (pour les rapports) ──
    async getSummary(tenantId: string, cycleId: string) {
        return prisma.expense.groupBy({
            by : ["category"],
            where: { tenantId, cycleId },
            _sum:   { amount: true },
            _count: { _all: true },
        });
  }
}