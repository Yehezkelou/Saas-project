import { Router } from "express";
import { requireAuth } from "../middleware/auth.middleware";
import { requireActiveTenant } from "../middleware/tenant.middleware";
import { StaffController } from "../controller/staff.controller";
import { validate } from "../middleware/validate.middleware";
import { changeStaffPinSchema, createStaffSchema, updateStaffSchema } from "../validators/staff.validator";
import { StaffLoginSchema } from "../validators/Auth.validator";
import prisma from "../lib/prisma";
import { checkLimit } from "../lib/plan-gate.middleware";


const router = Router()
const controller = new StaffController()


router.use(requireAuth, requireActiveTenant)

router.get("/", controller.list)

router.post("/", checkLimit("staff_count", (tenantId) =>
    prisma.staff.count({ where: { tenantId } })
  ) ,validate(createStaffSchema), controller.create)

router.put("/:id", validate(updateStaffSchema), controller.update)
router.put("/:id/change-pin", validate(changeStaffPinSchema), controller.changePin)
router.delete("/:id", controller.delete)
router.post("/pin-login", validate(StaffLoginSchema), controller.loginpin)


export default router