import { Router } from "express";
import { SubscriptionController } from "../controller/subscription.controller";
import { requireAuth, requireSuperAdmin, requireAdmin } from "../middleware/auth.middleware";
import { requireActiveTenant } from "../middleware/tenant.middleware";
import { validate } from "../middleware/validate.middleware";
import { changePlanShema, renewSubcriptionSchema } from "../validators/subscription.validator";


const router = Router();
const controller = new SubscriptionController();

// ── ROUTES SUPER ADMIN (Gestion globale) ────────────────────
// Ces routes n'ont pas besoin de requireActiveTenant car elles concernent tous les tenants
router.get("/all",               requireAuth, requireSuperAdmin, controller.listAll);
router.get("/stats",             requireAuth, requireSuperAdmin, controller.getStats);
router.post("/verify/:tenantId",  requireAuth, requireSuperAdmin, controller.verify);
router.post("/suspend/:tenantId", requireAuth, requireSuperAdmin, controller.suspend);
router.post("/activate/:tenantId", requireAuth, requireSuperAdmin, controller.activate);
router.post("/reject/:tenantId",   requireAuth, requireSuperAdmin, controller.reject);
router.post("/admin/change-plan/:tenantId", requireAuth, requireSuperAdmin, controller.adminChangePlan);
router.delete("/tenant/:tenantId", requireAuth, requireSuperAdmin, controller.deleteTenant);

// ── ROUTES ADMIN (Gestion de son propre établissement) ──────
router.use(requireAuth, requireActiveTenant);

// Voir son abonnement + utilisation — tous les users
router.get(  "/",      controller.get);

// Changer de plan + renouveler — ADMIN seulement
router.patch("/plan",  requireAdmin, validate(changePlanShema),       controller.changePlan);
router.post( "/renew", requireAdmin, validate(renewSubcriptionSchema), controller.renew);

export default router;