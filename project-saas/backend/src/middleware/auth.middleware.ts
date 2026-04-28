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

// Midlleware verifie qu'on est bien ADMIN ou SUPERADMIN
export function requireAdmin(req : Request, res : Response, next: NextFunction){
    if(req.user?.role !== "ADMIN" && req.user?.role !== "SUPERADMIN"){
        return res.status(403).json({
            success: false,
            message : "Accés refusé - role ADMIN requis"
        })
    }
    next();
}

// Middleware verifie qu'on est bien SUPERADMIN (Le gérant du SaaS)
export function requireSuperAdmin(req : Request, res : Response, next: NextFunction){
    if(req.user?.role !== "SUPERADMIN"){
        return res.status(403).json({
            success: false,
            message : "Accés réservé à l'administrateur système"
        })
    }
    next();
}

// Middleware verifie qu'on est bien STAFF (ou ADMIN/MANAGER car ils ont tous les droits)
export function requireStaff(req : Request, res : Response, next: NextFunction){
    if(req.user?.role !== "STAFF" && req.user?.role !== "ADMIN" && req.user?.role !== "MANAGER"){
        return res.status(403).json({
            success: false,
            message : "Accés refusé - role STAFF requis"
        })
    }
    next();
}












