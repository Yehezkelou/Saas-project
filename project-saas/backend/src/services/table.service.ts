import  jwt  from "jsonwebtoken";
import prisma from "../lib/prisma"
import type { createTableInput, updateTableInput } from "../validators/table.validator"
import crypto from "crypto";





export class TableService{
    
    getUrl(qrToken :string){
        return `${process.env.FRONTEND_URL}/scan/${qrToken}`
    }

    // liste des table avec leur status en temp reel
    async list(tenantId: string){
        // On ne regarde que l'occupation du cycle ACTIF
        const activeCycle = await prisma.cycle.findFirst({
            where: { tenantId, status: "OPEN" },
            select: { id: true }
        });

        const table = await prisma.table.findMany({
            where: { tenantId },
            orderBy: { name: "asc" },
            include: {
                orders: {
                    where: activeCycle ? {
                        status: { not: "PAID" },
                        cycleId: activeCycle.id
                    } : { id: "none" }, // Si pas de cycle, on ne veut aucune commande
                    orderBy: { createdAt: "desc" },
                    select: {
                        id: true,
                        status: true,
                        totalAmount: true,
                        createdAt: true,
                    },
                    take: 1
                }
            }
        }) as any[]; // Utilisation de any pour éviter les erreurs de type sur l'include dynamique

        return table.map((t) => ({
            ...t,
            qrUrl: this.getUrl(t.qrToken),
            activeOrder : t.orders[0] ?? null,
            orders : undefined // pour ne pas polluer la reponse
        }))
    }

    // create table 
    async create(tenantId : string, data : createTableInput){
        // verifier si la table exite deja 
        const existing = await prisma.table.findFirst({
            where : {
                tenantId : tenantId,
                name : data.name
            }
        })
        if(existing) throw new Error("TABLE_ALREADY_EXIST")
        
        // create 
        const table = await prisma.table.create({
            data : {
                tenantId,
                ...data
            }
        })

        return {...table , qrUrl: this.getUrl(table.qrToken)}
    }

    // update table 
    async update(tenantId : string, tableId : string, data : updateTableInput){
        // verifier si la table existe
        const existing = await prisma.table.findFirst({
            where : { tenantId, id : tableId}
        })
        if(!existing) throw new Error("TABLE_NOT_FOUND")

        // update 
        const table = await prisma.table.update({
            where : { id : tableId},
            data : {
                isActive : data.isActive!,
                name : data.name!,
            }
        })

        return {...table , qrUrl: this.getUrl(table.qrToken)}
    }

    // delete table 
    async delete(tenantId : string, tableId : string){
        // verifier si la table existe
        const existing = await prisma.table.findFirst({
            where : { tenantId, id : tableId}
        })
        if(!existing) throw new Error("TABLE_NOT_FOUND")

        // delete 
        const table = await prisma.table.delete({
            where : { id : tableId}
        })

        return {...table , qrUrl: this.getUrl(table.qrToken)}
    }


    // regenerer QRcode
    async regenerateQrCode(tenantId : string, tableId : string){
        // verifier si la table existe
        const existing = await prisma.table.findFirst({
            where : { tenantId, id : tableId}
        })
        if(!existing) throw new Error("TABLE_NOT_FOUND")

        // regenerer QRcode
        const update = await prisma.table.update({
            where : {tenantId, id: tableId},
            data: {
                qrToken : crypto.randomUUID()
            }
        })

        return {...update , qrUrl: this.getUrl(update.qrToken)}
    }


    // ── SCAN QR — point d'entrée client ───────────────────────
  // Appelé automatiquement quand le client scanne le QR.
  // Retourne un tableSessionToken valide 4h (durée d'un service).

  async createTableSession(qrToken : string){
    
    const table = await prisma.table.findUnique({
       where : {qrToken : qrToken} ,
       include : {
        tenant : {
            include : {
                subscription : true
            }
        }
       }

    })

    if(!table) throw new Error("TABLE_NOT_FOUND");
    if(!table.isActive) throw new Error("TABLE_INACTIVE");

    // verifier la subscription
    const sub = table.tenant.subscription;
    if(!sub || sub.status !== "ACTIVE") throw new Error("SUBSCRIPTION_SUSPENDED");
    if(sub.expiresAt < new Date()) throw new Error("SUBSCRIPTION_SUSPENDED");


    // generer le jwt 
    const tableSessionToken = jwt.sign(
        {
            tableId : table.id,
            tenantId : table.tenantId,
            tableName : table.name,
            type : "TABLE_SESSION"
        },
        process.env.JWT_SECRET!,
        {
            expiresIn : "4h"
        }
    )

    return {
        token : tableSessionToken, 
        table : {
            id : table.id,
            name : table.name,
        },
        tenant : {
            id : table.tenantId,
            name : table.tenant.name,
            businessType : table.tenant.businessType
        }
    }
  }
}