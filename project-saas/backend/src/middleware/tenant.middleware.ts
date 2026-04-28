// ce midleware s'assure que le tenant existe et est actif 
// Il inject aussi req.tenant pour simplifier les controllers
// Toujours placé APRES requireAuth

import type {Request, Response, NextFunction } from "express";
import prisma from "../lib/prisma";



declare global {
   namespace Express {
    interface Request {
        tenant?: string
    }
   }
}


export async function requireActiveTenant(req: Request, res: Response, next: NextFunction){
            const tenantId = req.user?.tenantId 

            if(!tenantId){
                return res.status(401).json({
                    success : false,
                    message : "Tenant non identifié"
                })
            }

            const subscription = await prisma.subscription.findUnique({
                where : {
                    tenantId
                }, 
                select : {
                    status: true,
                    expiresAt : true
                }
            })

            if(!subscription || subscription.status === "SUSPENDED"){
                return res.status(403).json({
                    success : false,
                    message : "Abonnement suspendu - contactez le support"
                })
            }

            if(subscription.expiresAt <  new Date()){
                return res.status(403).json({
                    success : false,
                    message : "Abonnement expirer - veuillez renouveller"
                })
            }

            req.tenant = tenantId
            next()
}