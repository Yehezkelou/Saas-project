import prisma from "../lib/prisma";
import type { closeCycleInput, OpenCycleInput } from "../validators/cycle.validator";





export class CycleService {


    // prendre le cylce actif 
    async getActive(tenantId : string){
        const cycle = await prisma.cycle.findFirst({
            where : {
                tenantId,
                status : "OPEN"
            },
            include : {
                _count : {
                    select : { orders : true , expenses : true}
                }
            }
        })

        if (!cycle) return null;

        // Calculer les totaux actuels
        const [payments, expenses] = await Promise.all([
            prisma.payment.groupBy({
                by : ['method'],
                where : {tenantId, order : {cycleId : cycle.id}},
                _sum : {amount : true}
            }),
            prisma.expense.aggregate({
                where : {tenantId, cycleId : cycle.id},
                _sum : {amount : true}
            })
        ]);

        const totalCash = payments.find(p => p.method === "CASH")?._sum.amount ?? 0;
        const totalExpenses = expenses._sum.amount ?? 0;
        const expectedCash = (cycle.openingCash ?? 0) + totalCash - totalExpenses;

        return {
            ...cycle,
            totalCash,
            totalExpenses,
            expectedCash,
            paymentSummary: payments.map(p => ({ method: p.method, total: p._sum.amount ?? 0 }))
        };
    }

    // ouvrir un nouveau cycle 
    async open(tenantId : string , data : OpenCycleInput){
        // verifier si il y pas deaja un cycle ouvert 
        const existing = await prisma.cycle.findFirst({
            where : {
                tenantId, 
                status : "OPEN"
            }
        })
        if(existing) throw new Error("CYCLE_ALREADY_OPEN")

        // ouvrire le cycle
        return prisma.cycle.create({
            data : {
                tenantId,
                openingCash : data.openingCash ?? 0,
                status : "OPEN"
            }
        })
    }

    // fermer un cylce 
    async close(tenantId : string, cycleId : string, data : closeCycleInput){
        // verifier si le cycle appartient au tenant 
        const cycle = await prisma.cycle.findFirst({
            where :{
                id : cycleId,
                tenantId,
                status : "OPEN"
            }
        })
        if(!cycle) throw new Error("CYCLE_NOT_FOUND")

        // verifie si il y a plus de commander non payé 
        const pendingOrders = await prisma.order.count({
            where : {
                cycleId : cycleId,
                tenantId,
                status : {in : ["PENDING", "VALIDATED"]} // Statuts non payés
            }
        })
        if(pendingOrders > 0) throw new Error("HAS_UNPAID_ORDERS")
        
        // calculer les totaux du cycle pour le rapport 
        const [payments, expenses] = await Promise.all([
            prisma.payment.groupBy({
                by : ['method'],
                where : {tenantId, order:{cycleId}},
                _sum : {amount : true}
            }),

            prisma.expense.aggregate({
                where: {tenantId, cycleId},
                _sum : {amount : true}
            })
        ])

        const totalRevenu = payments.reduce((acc, p) => acc + (p._sum.amount || 0), 0)
        const totalExpenses = expenses._sum.amount || 0
        const netProfit = totalRevenu - totalExpenses

        // ecart de caisse difference entre ce qu'on devait avoir et ce qu'on a compté
        const cashPayment = payments.find(p => p.method == "CASH")?._sum.amount || 0
        const cashDifference = (data.closingCash || 0) - ((cycle.openingCash || 0) + cashPayment)

        // On formate les payments pour le JSON pour s'assurer que c'est un objet pur
        const paymentSummary = payments.map(p => ({
            method: p.method,
            amount: p._sum.amount || 0
        }));

        // fermer le cycle avec le rapport
        const closedCycle = await prisma.cycle.update({
            where : {tenantId, id : cycleId},
            include: { report: true },
            data : {
                status: "CLOSED",
                closedAt : new Date(),
                closingCash : data.closingCash || 0,
                note : data.notes || "",

                report : {
                    create : {
                        tenantId,
                        totalRevenu: totalRevenu || 0,
                        totalExpenses: totalExpenses || 0,
                        netProfit: netProfit || 0,
                        cashDifference: cashDifference || 0,
                        paymentByMethod: paymentSummary as any
                    }
                }
            }
        })

        return {cycle : closedCycle, report : closedCycle.report}
    }


    // Rapport detaillé d'un cycle 
    async getRaport(tenantId: string, cycleId: string){
        // verifier si le cycle appartient au tenant
        const cycle = await prisma.cycle.findFirst({
            where :{tenantId, id : cycleId}
        })
        if(!cycle) throw new Error("CYCLE_NOT_FOUND")

        const [payements , orders, expenses] = await Promise.all([
            prisma.payment.findMany({
                where : {tenantId, order :{ cycleId}},
                include : {order : {select : {id: true, totalAmount : true}}},
            }),

            prisma.order.findMany({
                where : {tenantId, cycleId},
                include : {
                    items : {include : {product : {select : {name : true}}}},
                    table : {select : {name : true}}
                    
                }
            }),

            prisma.expense.findMany({where : {tenantId, cycleId}})
        ])

        // calculer les totaux 
        const totalRevenue = payements.reduce((s, p) => s + p.amount, 0);
        const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0);
        

        return {
            cycle, 
            summary : {
                totalRevenue,
                totalExpenses,
                paidOrders : orders.filter((o, _) => o.status == "PAID").length,
                totalOrders : orders.length,
                netProfit : totalRevenue - totalExpenses,
                averageBasket :  orders.length ? totalRevenue / orders.length : 0,
            },
            payements,
            orders,
            expenses
        }
    }


    // liste des cylce 
    async list(tenantId : string){
        return prisma.cycle.findMany({
            where : {tenantId},
            orderBy : {openedAt : "desc"},
            select : {
                id : true, status : true, openedAt: true, closedAt: true,
                report : true,
                _count : {
                    select : {orders : true}
                }
            }
        })
    }

    // 
}