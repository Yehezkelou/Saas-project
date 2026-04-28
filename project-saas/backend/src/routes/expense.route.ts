import { Router } from "express";
import { ExpenseController } from "../controller/expense.controller";
import { requireAuth } from "../middleware/auth.middleware";
import { requireActiveTenant } from "../middleware/tenant.middleware";
import { validate } from "../middleware/validate.middleware";
import { createExpenseSchema, updateExpenseSchema } from "../validators/expense.validator";




const router = Router()
const controller = new ExpenseController()

router.use(requireAuth, requireActiveTenant);


router.get("/", controller.list);
router.post("/", validate(createExpenseSchema), controller.create);
router.put("/:id", validate(updateExpenseSchema), controller.update);
router.delete("/:id", controller.delete);
router.get("/summary/:cylceId", controller.getSummary)


export default router
