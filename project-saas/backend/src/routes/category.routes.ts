import {Router} from "express"
import { CategoryController } from "../controller/category.controller"
import { requireAuth } from "../middleware/auth.middleware"
import { requireActiveTenant } from "../middleware/tenant.middleware"
import { validate } from "../middleware/validate.middleware"
import { createCategorieSchema, updateCategorieSchema } from "../validators/categorie.validator"
import prisma from "../lib/prisma"
import { checkLimit } from "../lib/plan-gate.middleware"


const router = Router()
const controller = new CategoryController()

router.use(requireAuth, requireActiveTenant)



router.get("/", controller.list)
router.post("/",  checkLimit("categories_count", (tenantId) =>
    prisma.category.count({ where: { tenantId } })
  ) ,validate(createCategorieSchema), controller.create)
router.put("/:id", validate(updateCategorieSchema), controller.update)
router.delete("/:id", controller.delete)

export default router;



