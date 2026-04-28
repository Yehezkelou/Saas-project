import { Router } from "express";
import { CycleController } from "../controller/cycle.controller";
import { requireAuth } from "../middleware/auth.middleware";
import { requireActiveTenant } from "../middleware/tenant.middleware";
import { validate } from "../middleware/validate.middleware";
import { closeCycleSchema, openCycleSchema } from "../validators/cycle.validator";
import { requirePlan } from "../lib/plan-gate.middleware";




const router = Router();
const controller = new CycleController()


router.use(requireAuth, requireActiveTenant);


router.get("/active", controller.getActive)

router.post("/", validate(openCycleSchema), controller.open)
router.post("/:id/close", validate(closeCycleSchema), controller.close)


router.get("/", controller.list)
router.get("/:id/report", requirePlan("FREE"),  controller.detailedReport)


export default router