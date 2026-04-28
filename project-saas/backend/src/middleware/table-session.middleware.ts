import type  { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";





interface TableSessionPayload{
    tableId : string;
    tenantId : string;
    tableName : string;
    type : "TABLE_SESSION"
}

declare global {
    namespace Express{
        interface Request{
            tableSession? : TableSessionPayload
        }
    }
}



export function requireTableSession(req : Request, res : Response, next : NextFunction){
    const authHeader = req.headers.authorization

    if(!authHeader?.startsWith("Bearer")){
        return res.status(401).json({
            success : false,
            message : "Scanner le Qr code pour commander"
        })
    }

    const token = authHeader.split(" ")[1]

    try {
        const payload = jwt.verify(token!, process.env.JWT_SECRET!) as TableSessionPayload;

        if(payload.type !== "TABLE_SESSION"){
           throw new Error("Mauvais type de token")
        }
        req.tableSession = payload;
        req.tenant = payload.tenantId; // Le tenantId est requis pour OrderService.create
        next()
    }catch(error){
        return res.status(401).json({
            success : false,
            message : "Token de table invalide ou a expiré"
        })
    }

}






