
import type { Request, Response } from "express";
import { fa, tr } from "zod/locales";
import { AuthService } from "../services/modules/auth.service";
import { success } from "zod";
import prisma from "../lib/prisma";





export class AuthController {

    async RegisterController(req : Request, res : Response){
        try{
            const result  = await new AuthService().register(req.body)
            return res.status(201).json({
                success: true,
                data : result
            })
        }catch(error : any) {
            if(error.message === "EMAIL_ALREADY_EXISTS"){
                return res.status(409).json({
                    success : false,
                    message : "Cet email est déja utilisé"
                })
            }
        }

        return res.status(500).json({
            success : false,
            message : "Erreur serveur"
        })
    }



    async LoginController(req: Request, res: Response){

        try{
            const result = await new AuthService().login(req.body)
            return res.status(200).json({
                success : true,
                data : result
            })
        }catch(error : any){
            if(error.message === "INVALID_CREDENTIALS"){
                return res.status(401).json({
                    success: false,
                    message : "Email ou mot de passe incorrect"
                })
            }

            if(error.message === "ACCOUNT_SUSPENDED"){
                return res.status(403).json({
                    success: false,
                    message : "Compte suspendu",
                })
            }
        }
        return res.status(500).json({
            success : false,
            message : "Erreur serveur"
        })
    }



    // route protegée : Retourne les infos du user  connecté
    async me(req: Request, res : Response){
        const user = await prisma.user.findUnique({
            where : {id : req.user!.userId},
            select : {
                id : true, email :true , role : true, createdAt : true,
                tenant : {
                    select : {
                        id : true, name: true, businessType : true
                    }
                }
            }
        })
    }
}