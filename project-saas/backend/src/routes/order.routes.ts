import { Router } from "express";
import { OrderController } from "../controller/order.controller";
import type  { Request, Response, NextFunction } from "express";
import { requireTableSession } from "../middleware/table-session.middleware";
import { requireAuth } from "../middleware/auth.middleware";
import { requireActiveTenant } from "../middleware/tenant.middleware";
import { validate } from "../middleware/validate.middleware";
import { addOrderItemSchema, createOrderSchema, updateOderStatusSchema } from "../validators/order.validator";
import { checkMonthlyOrderLimit } from "../lib/plan-gate.middleware";

const router = Router();
const controller = new OrderController()


// certain route accepte les deux token 
function requireAuthOrTableSession(req : Request, res : Response, next : NextFunction){
    const authHeader = req.headers.authorization;
    if(!authHeader){
        res.status(401).json({success : false , message : "non autorisé"})
    }

    // decoder le token pour voir son type 
    try {
        const token = authHeader?.split(" ")[1]
        const payload = JSON.parse(Buffer.from(token!.split(".")[1]!, "base64").toString())

        if(payload.type == "TABLE_SESSION"){
            // on attache la session a la requete
            return requireTableSession(req, res, next)
        }else{
            return requireAuth(req, res, () => requireActiveTenant(req, res, next))
        }
    }catch(error){
        return res.status(401).json({
            success : false,
            message : "Token invalide ou a expiré"
        })
    }
}


// route accessible au deux Staff et client 
router.post("/",              requireAuthOrTableSession, checkMonthlyOrderLimit(), validate(createOrderSchema), controller.create);
router.get("/:id",             requireAuthOrTableSession, controller.getById);
router.put("/:id/items",       requireAuthOrTableSession, validate(addOrderItemSchema), controller.addOrderItem);


// route accessible au staff seulement
router.get(  "/",                      requireAuth, requireActiveTenant, controller.list);
router.patch("/:id/status",            requireAuth, requireActiveTenant, validate(updateOderStatusSchema), controller.updateStatus);
router.delete("/:id/items/:itemId",    requireAuthOrTableSession, controller.removeOrderItem); 
router.delete("/:id",                  requireAuthOrTableSession, controller.cancel);


export default router;