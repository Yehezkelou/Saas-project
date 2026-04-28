
import { Router } from "express";
import { ProductModelController } from "../controller/productModel.controller";
import { requireAuth } from "../middleware/auth.middleware";
import { requireActiveTenant } from "../middleware/tenant.middleware";

const router = Router();
const controller = new ProductModelController();

// Routes publiques (accessibles par tous les tenants connectés avec un abonnement actif)
router.get("/categories", requireAuth, requireActiveTenant, controller.getCategories);
router.get("/category/:categoryId", requireAuth, requireActiveTenant, controller.getModelsByCategory);
router.post("/import", requireAuth, requireActiveTenant, controller.importModel);

export default router;
