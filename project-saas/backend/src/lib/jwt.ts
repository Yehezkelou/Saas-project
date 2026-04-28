import jwt from "jsonwebtoken"


const JWT_EXPIRES_IN = "7d";


// le payload du jwt qui sera placé dans le token et du coup dans la requete
export interface  JwtPayload {
    userId?: string,
    staffId?: string,
    tenantId: string,
    role : "SUPERADMIN" | "ADMIN" | "MANAGER" | "STAFF",
    permissions?: string[]
}


// creation du token 
export function Signtoken(payLoad: JwtPayload): string {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
        throw new Error("La variable d'environnement JWT_SECRET est manquante ou vide.");
    }
    return jwt.sign(payLoad, secret, {expiresIn : JWT_EXPIRES_IN})
}


// veirification du jwt 
export function verifieToken(token : string) : JwtPayload {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
        throw new Error("La variable d'environnement JWT_SECRET est manquante ou vide.");
    }
    return jwt.verify(token, secret) as JwtPayload;
}
