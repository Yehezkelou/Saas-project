import bcrypt from "bcryptjs";
import prisma from "../../lib/prisma";
import type { loginInput, registerInput } from "../../validators/Auth.validator";
import { getDefaultCategories, getDefaultRoles, getDefaultSubscription, type Role } from "../../lib/defaults";
import { sign } from "node:crypto";
import { Signtoken } from "../../lib/jwt";
import { BusinessType } from "../../../generated/prisma/enums";
import { email } from "zod";
import { bytes } from "node:stream/consumers";








export class AuthService {

    // Enregistrement 
    async register(data: registerInput){

        // verifier si l'email exites deja dans la base
        const email = await prisma.user.findUnique({
            where : {
                email : data.email
            }
        })

        if(email){
            throw new Error("EMAIL_ALREADY_EXISTE")
        }

        // hasher le mot de passe 
        const hashedPassword = await bcrypt.hash(data.password, 12);

        // creer le tenant et L'utilsateur en une seule fois
        const result = await prisma.$transaction(async (tx) => {

            // Etape 1 creer le Tenant (l'etablissement)
            const tenant = await tx.tenant.create({
                data : {
                    name : data.tenantName,
                    businessType :data.businessType,
                    
                }
            })

            // Etape 2 creer le user ratacher a l'etablissement
            const user = await tx.user.create({
                data: {
                    tenantId : tenant.id,
                    email : data.email,
                    password : hashedPassword,
                }
            })

            // Etape 3 creer l'abonnement FREE
            await tx.subscription.create({
                data : {
                    tenantId : tenant.id,
                    ...getDefaultSubscription(),
                }
            })

            // Etape 4 creer les roles par defauts selon le businessType
            const defautsRoles = getDefaultRoles(data.businessType)
            await tx.role.createMany({
                data: defautsRoles?.map((role) => ({
                    tenantId : tenant.id,
                    name : role.name,
                    permission : role.permissions
                })),
            });

            // Etape 5 creer les categorie par defaut
            const defaultCategories = getDefaultCategories(data.businessType)
            await tx.category.createMany({
                data: defaultCategories.map((cat) => ({
                    tenantId : tenant.id,
                    name : cat.name,
                    type : cat.type 
                }))
            })

        return {tenant, user}
        })

        const token = Signtoken({
            userId : result.user.id,
            tenantId : result.tenant.id,
            role : "ADMIN"
        })


        return {
            token, 
            user : {
                id : result.user.id,
                email : result.user.email,
                role : result.user.role
            }, 
            tenant: {
                id : result.tenant.id,
                name : result.tenant.name,
                BusinessType : result.tenant.businessType
            }
        }
    }


    // Connexion au SAss 
    async login(data : loginInput){

        // verifier l'email 
        const user = await prisma.user.findUnique({
            where : {
                email : data.email
            },
            include : {
                tenant : true
            }
        })

        if(!user) {
            throw new Error("INVALID_CREDENTIALS")
        }

        // verifier le mot de passe
        const isPassword = await bcrypt.compare(data.password, user.password)

        if(!isPassword){
             throw new Error("INVALID_CREDENTIALS")
        }

        // verifier si l'abonnement est toujour valide 
        const  subscription = await prisma.subscription.findUnique({
            where : {
                tenantId : user.tenantId
            }
        })

        if(!subscription ||subscription?.status == "SUSPENDED"){
            throw new Error("ACCOUNT_SUSPENDED")
        }


        const token = Signtoken({
            userId : user.id,
            tenantId: user.tenantId,
            role : user.role
        })


        return {
            token, 
            user : {
                id : user.id,
                tenantId : user.tenantId,
                role : user.role
            },
            tenant : {
                id : user.tenant.id,
                name : user.tenant.name,
                BusinessType : user.tenant.businessType,
            }
        }
    }
}