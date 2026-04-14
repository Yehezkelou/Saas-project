import jwt from "jsonwebtoken"


const JWT_SECRET = process.env.JWT_SECRET!;
const JWT_EXPIRES_IN = "7d";


export interface  JwtPayload {
    userId: string,
    tenantId: string,
    role : "ADMIN" | "MANAGER"
}

// creation du token 
export function Signtoken(payLoad: JwtPayload): string {
    return jwt.sign(payLoad, JWT_SECRET, {expiresIn : JWT_EXPIRES_IN})
}

// veirification du jwt 
export function verifieToken(token : string) : JwtPayload {
    return jwt.verify(token, JWT_SECRET) as JwtPayload;
}
