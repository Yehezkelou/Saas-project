import prisma from "../lib/prisma";
import type { addOrderItemInput, createOrderInput, listOrdersQuery, updateOrderStatusInput } from "../validators/order.validator";








export class OrderService {

    //create commande
    async create(tenantId : string, tableId : string | null, data : createOrderInput, isStaff : boolean = false){
        // verifie si la table existe (si fournie)
        if (tableId) {
            const table = await prisma.table.findFirst({
                where : {tenantId, id :tableId, isActive : true}
            })
            if(!table) throw new Error("TABLE_NOT_FOUND")
        }

        // verifier si le cycle est OPEN pour ce tenant
        const cycle = await prisma.cycle.findFirst({
            where : {tenantId, status: "OPEN"}
        })
        if(!cycle) throw new Error("NO_ACTIVE_CYCLE")

        // recuperer tout les produit en une seule requete
        const productId = data.items.map((item) => item.productId)
        const products = await prisma.product.findMany({
            where : {id: {in : productId}, tenantId, isActive : true}
        })

        // verifier si tout les produit existe 
        if(products.length !== productId.length) throw new Error("PRODUCT_NOT_FOUND")
        
        // verifier le stock de chaque produit
        for(const item of data.items){
            const product = products.find((p) => p.id == item.productId)
            if(product!.stock <  item.quantity) throw new Error(`INSUFFICIENT_STOCK:${product?.name}`)
        }


        // calcule du total de la commander
        const totalAmount = data.items.reduce((sum, item) => {
            const product = products.find((p) => p.id == item.productId)
            return sum + product!.price * item.quantity
        }, 0)
        

        // transaction du ou rien 
        return await prisma.$transaction(async (tx) => {
            // 1- creer la commande 
            const order = await tx.order.create({
                data: {
                    tenantId,
                    tableId,
                    cycleId : cycle.id,
                    totalAmount,
                    status : isStaff ? "VALIDATED" : "PENDING",
                    items : {
                        create : data.items.map((item) => {
                            const product = products.find((p) => p.id === item.productId);

                            return {
                                tenantId,
                                productId : item.productId,
                                quantity : item.quantity,
                                price : product!.price
                            }
                        })
                    }
                
                },
                include : {
                    items : {include : {product : {select : {price :true , name : true}}}},
                    table : {select : {name : true}}

                }
            })

            //Décrementer le stock de chaque produit
            await Promise.all(
                data.items.map((item) =>
                    tx.product.update({
                        where : {id : item.productId, tenantId},
                        data : {
                            stock : {decrement : item.quantity}
                        }
                    })
                )
            )

            // creer des notification si certain produit passe sous seuil
            const lowStockProducts = data.items.map(item => {
                const p = products.find(prod => prod.id === item.productId)!;
                if ((p.stock - item.quantity) <= p.minStock) return p;
                return null;
            }).filter(Boolean);

            if(lowStockProducts.length > 0){
                await tx.notification.createMany({
                    data : lowStockProducts.map((p) => ({
                        tenantId,
                        title : "stock faible",
                        message : `le stock de ${p!.name} est faible`,
                        category: "WARNING"
                    }))
                })
            }

            return order
        })
    }


    // liste des commander 
    async list(tenantId: string, query : listOrdersQuery){
        const where : any = { tenantId }
        
        if (query.status) where.status = query.status as any;
        if (query.tableId) where.tableId = query.tableId;
        if (query.cycleId) where.cycleId = query.cycleId;

        return prisma.order.findMany({
            where, 
            include : {
                table : {select : {name : true}},
                items : {include : {product :{select : {name: true}}}}
            },
            orderBy : {
                createdAt : "desc"
            }
        })
    }

    // detail d'un commander
    async getById(tenantId : string, orderId : string){
        // verifier si la commande appartient au tenant
        const existing = await prisma.order.findFirst({
            where : {tenantId, id : orderId},
            include : {
                items : {include : {product : {select : {name : true, price : true}}}},
                table : {select : {name : true}},
                payments : true
            }
        })
        if(!existing) throw new Error("ORDER_NOT_FOUND");

        return existing 

    }

    // changer le status d'une commande
    async updateStatus(tenantId : string , orderId : string , data : updateOrderStatusInput){
        // verifier si la commande appartient au tenant
        const existing = await prisma.order.findFirst({
            where : {tenantId : tenantId, id : orderId}
        })
        if(!existing) throw new Error("ORDER_NOT_FOUND")

        if(existing.status == "PAID") throw new Error("ORDER_ALREADY_PAID")

        // Définition des transitions de statut valides
        // Un dictionnaire qui dit : "si je suis en statut X, j'ai le droit de passer en statut Y"
        const valideTransaction : Record<string, string[]> = {
            PENDING : ["PENDING", "VALIDATED", "REJECTED"], 
            VALIDATED : ["VALIDATED", "PAID", "REJECTED"], 
            PAID : ["PAID"],
            REJECTED: ["REJECTED"]
        }


        if(!valideTransaction[data.status]?.includes(data.status)){
            throw new Error("INVALID_STATUS_TRANSITION")
        }

        return prisma.order.update({
            where : {id : orderId, tenantId},
            data : {
                status : data.status as any
            }
        })

        
    }

    // ajouter des items a une commande existante
    async addItem(tenantId: string , orderId : string, data : addOrderItemInput){
        // verifier si la commande existe et appartient au tenant
        const existing = await prisma.order.findFirst({
            where : {tenantId, id : orderId}
        })
        if(!existing) throw new  Error("ORDER_NOT_FOUND")

        if(existing.status == "PAID") throw new Error("ORDER_ALREADY_PAID")

        // recuperer les items
        const productId = data.items.map((item) => item.productId)
        const products = await prisma.product.findMany({
            where : {id : {in: productId}, tenantId, isActive : true}
        })

        // verifier si tout les produit existe
        if(products.length !== productId.length) throw new Error("PRODUCT_NOT_FOUND")
        
        // verifier le stock de chaque produit
        for(const item of data.items){
            const product = products.find((p) => p.id == item.productId)
            if(product!.stock < item.quantity) throw new Error(`INSUFFICIENT_STOCK:${product?.name}`)
        }

        // calculer le nouveau total 
        const addAmount = data.items.reduce((sum, item) => {
            const product = products.find((p) => p.id == item.productId)
            return sum + product!.price * item.quantity
        }, 0)

        // transactio 
        return prisma.$transaction(async (tx) => {
            // 1 ajouter les items 
            await tx.orderItem.createMany({
                data : data.items.map((item) => {
                    const product = products.find((p) => p.id == item.productId)!;
                    return {
                        tenantId,
                        orderId,
                        productId : item.productId,
                        quantity : item.quantity,
                        price : product.price
                    }
                })
            })

            // mettre a jour le total de la commande
            await tx.order.update({
                where : {id : orderId, tenantId},
                data : {
                    totalAmount : { increment : addAmount }
                }
            })

            // decrementer le stock 
            const updatedProducts = await Promise.all(
                data.items.map((item) =>
                    tx.product.update({
                        where : { id : item.productId, tenantId },
                        data : { stock : { decrement : item.quantity } }
                    })
                )
            )

            // creer des notification si certain produit passe sous seuil
            const lowStockProducts = updatedProducts.filter(p => p.stock <= p.minStock);

            if(lowStockProducts.length > 0){
                await tx.notification.createMany({
                    data : lowStockProducts.map((p) => ({
                        tenantId,
                        title : "stock faible",
                        message : `le stock de ${p.name} est faible (${p.stock} restant)`,
                        category: "WARNING"
                    }))
                })
            }

            return tx.order.findUnique({
                where : {id : orderId, tenantId},
                include : {
                    items : {include : {product : {select : {name: true}}}},
                    table : {select : {name: true}}
                }
            })

            

        })
    }

    // suprimer un item a une commande existante
    async removeItem(tenantId : string , orderId : string, itemId: string){
        // verifier si la commande existe et appartient au tenant
        const existing = await prisma.order.findFirst({
            where : {
                tenantId,
                id : orderId
            },
            include : {
                items : true
            }
        })

        if(!existing) throw new Error("ORDER_NOT_FOUND");
        if(existing.status == "PAID") throw new Error("ORDER_ALREADY_PAID");
        
        // verifier si l'item appartient a la commande
        const item = existing.items.find((i) => i.id == itemId)
        if(!item) throw new Error("ITEM_NOT_FOUND")
        
        // calculer le total 
        const removeAmount = item.price * item.quantity

        // transaction 
        return prisma.$transaction(async (tx) => {
            // 1 suprimer l'item 
            await tx.orderItem.delete({
                where: {tenantId, id : itemId}
            })

            // 2. Mettre à jour le montant total de la commande (décrémentation)
            // On récupère la commande mise à jour avec ses articles restants pour vérification
            const updatedOrder = await tx.order.update({
                where : {tenantId, id : orderId},
                data : {
                    totalAmount : {decrement : removeAmount}
                },
                include: { items: true }
            })

            // 3. LOGIQUE D'ANNULATION AUTOMATIQUE :
            // Si après la suppression il ne reste plus aucun article, on passe la commande en statut "CANCELLED"
            if (updatedOrder.items.length === 0) {
                await tx.order.update({
                    where: { id: orderId, tenantId },
                    data: { status: "REJECTED" }
                });
            }

            // 4. Mettre à jour le stock du produit supprimé (on le remet en stock)
            await tx.product.update({
                where : {
                    tenantId, 
                    id : item.productId
                },
                data : {
                    stock : {increment : item.quantity}
                }
            })

            // Retourner la commande mise à jour avec les nouveaux articles et le statut éventuel "CANCELLED"
            return tx.order.findUnique({
                where: { id: orderId, tenantId },
                include: { 
                    items: { include: { product: { select: { name: true } } } },
                    table: { select: { name: true } }
                }
            });
        })

    }

    /**
     * Annule une commande complète
     * @param tenantId ID de l'établissement
     * @param orderId ID de la commande à annuler
     */
    async cancel(tenantId: string, orderId: string) {
        // 1. Vérifier l'existence et l'appartenance
        const existing = await prisma.order.findFirst({
            where: { id: orderId, tenantId },
            include: { items: true }
        });

        if (!existing) throw new Error("ORDER_NOT_FOUND");
        
        // On ne peut pas annuler une commande déjà payée
        if (existing.status === "PAID") throw new Error("ORDER_ALREADY_PAID");

        // 2. Transaction pour annuler et remettre les produits en stock
        return prisma.$transaction(async (tx) => {
            // Passer le statut à CANCELLED
            const order = await tx.order.update({
                where: { id: orderId, tenantId },
                data: { status: "REJECTED" }
            });

            // Remettre tous les items en stock
            await Promise.all(
                existing.items.map((item) =>
                    tx.product.update({
                        where: { id: item.productId, tenantId },
                        data: { stock: { increment: item.quantity } }
                    })
                )
            );

            return order;
        });
    }

    
}