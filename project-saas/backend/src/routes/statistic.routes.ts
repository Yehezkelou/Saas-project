import { Router } from "express";
import { StatisticController } from "../controller/statistic.controller";
import { requireAuth } from "../middleware/auth.middleware";
import { requireActiveTenant } from "../middleware/tenant.middleware";

const router = Router();
const controller = new StatisticController();

// Appliquer les middlewares pour sécuriser les routes
router.use(requireAuth);
router.use(requireActiveTenant);

// Calculer une nouvelle statistique
router.post("/calculate", controller.calculate);

// Lister les statistiques calculées
router.get("/", controller.list);

export default router;
