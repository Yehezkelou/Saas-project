import { Router } from "express";
import { PayementController } from "../controller/payement.controller";
import { requireAuth } from "../middleware/auth.middleware";
import { requireActiveTenant } from "../middleware/tenant.middleware";
import { validate } from "../middleware/validate.middleware";
import { createPayementSchema, splitPayementSchema } from "../validators/payement.validator";


const router = Router()
const controller = new PayementController()


router.use(requireAuth, requireActiveTenant)


router.get("/", controller.list);
router.post("/", validate(createPayementSchema), controller.pay);
router.get("/:cycleId/summary", controller.summaryByCycle);
router.post("/order/:orderId/split", validate(splitPayementSchema), controller.splitPay)


export default router;