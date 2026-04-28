//Middleware générique Zod - utilisable sur Toute les routes
// Usage : route.post("/register", validate(registerSchema), controller)

import type { Request, Response, NextFunction } from "express";
import z from "zod";
import logger from "../lib/logger";


// source dit ou chercher les donnéees a valider
// "body"  req.body (POST, PUT, PATCH)
// "query" req.query (GET avec filtres)
// "params" req.params (route avec :id)

export function validate(
    schema : z.ZodType,
    source : "body"| "query" | "params" = "body"    
){

    return (req: Request, res: Response, next: NextFunction) => {
        const result = schema.safeParse(req[source])

        if(!result.success){
            
            logger.warn(`Erreur de validation sur ${source}: ${JSON.stringify(result.error.format())}`);
            
            const errors = result.error.issues.reduce((acc, err) => {
                // recuperation du champ
                const field = err.path[0] as string

                //initialisation du tableau d'erreur
                if(!acc[field]){
                    acc[field] = [];
                }

                // ajoute le message d'erreur au champ 
                acc[field].push(err.message)

                // on retourne l'objet Ex: {
                //  email : ["email invalide"]
                // }
                return acc; 

            }, {} as Record<string, string[]>)

            return res.status(400).json({
                success : false,
                message : "Données invalides",
                errors, 
            })
        }

        req[source] = result.data as any;
        next();
    } 
}

