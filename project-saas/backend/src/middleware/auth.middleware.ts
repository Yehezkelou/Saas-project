// Verifie que le token JWT est valide
// si OK attache le payload (userId, tenantIdn role) a req.user
// pour que les controllers y aient accés

import type { Request, Response, NextFunction } from "express"; 
import { verifieToken, type JwtPayload } from "../lib/jwt"; 


// on etend le type d'Express pour ajuster req.user
declare global {
    namespace Express {
        interface Request{
            user?:JwtPayload
        }
    }
}


export function requireAuth(req: Request, res : Response, next: NextFunction) {
    // Le token est envoyé dans le header : Authorization: Bearer "token"
    const authHeader = req.headers.authorization

    if (!authHeader || !authHeader.startsWith("Bearer")){
        return res.status(401).json({
            success : false,
            message:  "Token manquant- connectez-vous d'abord",
        })
    }

    const token = authHeader.split(" ")[1]

    try{

        const payload = verifieToken(token!)
        req.user = payload
        next();

    } catch(error){
        return res.status(401).json({
            success: false,
            message : "Token invalide ou expiré - reconnecter-vous"
        })
    }
}

// Midlleware verifie qu'on est bien ADMIN
export function requireAdmin(req : Request, res : Response, next: NextFunction){
    if(req.user?.role !== "ADMIN"){
        return res.status(403).json({
            success: false,
            message : "Accés refusé - role ADMIN requis"
        })
    }
}












