import {Router} from "express"
import { ProductController } from "../controller/product.controller"
import { requireAuth } from "../middleware/auth.middleware"
import { requireActiveTenant } from "../middleware/tenant.middleware"
import { validate } from "../middleware/validate.middleware"
import { adjustStockSchema, createProductSchema, updateProduitSchema } from "../validators/product.validator"
import { checkLimit } from "../lib/plan-gate.middleware"
import prisma from "../lib/prisma"


const router = Router()
const controller = new ProductController()



router.use(requireAuth, requireActiveTenant)

router.get("/", controller.list)

router.post("/",checkLimit("product_count", (tenantId) =>
    prisma.product.count({ where: { tenantId, isActive: true } })
  ), validate(createProductSchema), controller.create)
  
router.patch("/:id", validate(updateProduitSchema), controller.update)
router.delete("/:id", controller.delete)
router.post("/:id/adjust-stock", validate(adjustStockSchema), controller.adjustStock)
router.get("/low-stock", controller.lowStock)

export default router