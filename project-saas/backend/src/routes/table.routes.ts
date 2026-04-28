import { Router } from "express";
import { TableController } from "../controller/table.controller";
import { requireAuth } from "../middleware/auth.middleware";
import { requireActiveTenant } from "../middleware/tenant.middleware";
import { validate } from "../middleware/validate.middleware";
import { createTableSchema, updateTableSchema } from "../validators/table.validator";
import prisma from "../lib/prisma";
import { checkLimit } from "../lib/plan-gate.middleware";


const router = Router()
const controller = new TableController()

// Route publique - Doit être AVANT requireAuth
router.get("/scan/:qrToken", controller.scanQr)

// Routes protégées
router.use(requireAuth, requireActiveTenant)


router.get("/", controller.list)

router.post("/", checkLimit("table_count", (tenantId) =>
    prisma.table.count({ where: { tenantId, isActive: true } })
  ), validate(createTableSchema), controller.create)
  
router.put("/:id",validate(updateTableSchema), controller.update)
router.post("/:id/regenerate-qr", controller.regenerateQr)


export default router