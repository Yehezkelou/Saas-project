import prisma from "../lib/prisma";
import type { createPayementInput, listPayementQuery, splitPayementInput } from "../validators/payement.validator";







export class PayementService {


    // payement simple 
    async pay(tenantId: string, data: createPayementInput){
        
        // verification
        const order =  await prisma.order.findFirst({
            where : {tenantId, id : data.orderId},
            include: {
                payments : true
            }
        })
        
        if(!order) throw new Error("ORDER_NOT_FOUND");
        if(order.status == "PAID") throw new Error("ORDER_ALREADY_PAID");
        if(order.status == "PENDING") throw new Error("ORDER_NOT_READY");

        // calculer ce qui a deja été payé en cas de payment partiel
        const alreadyPaid = order.payments.reduce((sum, p) => sum + p.amount, 0);
        const remaining = order.totalAmount - alreadyPaid;

        if(data.amount > remaining + 0.01) throw new Error("AMOUNT_EXCEEDS_TOTAL");

        return prisma.$transaction(async (tx)=> {
            const payement = await tx.payment.create({
                data : {
                    tenantId,
                    orderId : data.orderId,
                    amount: data.amount,
                    method : data.method,
                }
            })

            // si le total est couvert passer a PAID
            const totalPaid = alreadyPaid + data.amount;
            if(totalPaid >= order.totalAmount - 0.01){
                await tx.order.update({
                    where : {id : data.orderId},
                    data : {
                        status : "PAID"
                    }
                })
            }

            return {payement}

        })
    }


    // split payement (payer plusieur methode en une fois)
    async splitPay(tenantId : string, orderId : string, data : splitPayementInput){
            const order = await prisma.order.findFirst({
                        where: { id: orderId, tenantId },
                        });
                    
            if (!order)                    throw new Error("ORDER_NOT_FOUND");
            if (order.status === "PAID")   throw new Error("ORDER_ALREADY_PAID");
            if (order.status === "PENDING") throw new Error("ORDER_NOT_READY");

            
            // la somme des payement doit correspondre au total des payement
            const totalPaid = data.payements.reduce((sum, p) => sum + p.amout, 0);
            if(Math.abs(totalPaid - order.totalAmount) > 0.01){
                throw new Error("SPLIT_AMOUNT_MISMATCH")
            }

            // on cree tout les payement d'un coup
            return prisma.$transaction(async (tx) => {
                const payement = await tx.payment.createMany({
                    data : data.payements.map((p) => ({
                        tenantId,
                        orderId,
                        method : p.method,
                        amount : p.amout,
                    }))
                })

                // passer la commande  a Paid
                await tx.order.update({
                    where : {id : orderId},
                    data : {
                        status : "PAID"
                    }
                })

                // retourne le recapitulatif 
                return await tx.payment.findMany({
                    where:{orderId}
                })
            })
            
    }


    // liste les payement d'un cycle
    async list(tenantId : string, cycleId : string){
        return await prisma.payment.findMany({
            where : {
                tenantId,
                order : {cycleId}
            },
            include : {
                order : {
                    select : {
                        id : true, totalAmount : true, status : true,
                        table : {
                            select : {
                                name : true
                            }
                        }
                    }
                }
            },
            orderBy : {createdAt : "desc"}

        })
    }


    // resumer des payement par methode pour le rapport
    async getSummaryByCycle(tenantId : string, cycleId : string){
        const grouped = await prisma.payment.groupBy({
            by : ["method"],
            where : {
                tenantId,
                order : {cycleId}
            },
            _sum : {
                amount : true
            },
            _count : {
                _all : true
            }
        })

        return grouped.map((g) => ({
            method : g.method,
            total : g._sum.amount ?? 0,
            transactions : g._count._all
        }))
    }
}