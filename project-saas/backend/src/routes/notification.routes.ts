import { Router } from "express";
import { NotificationController } from "../controller/notification.controller";
import { requireAuth } from "../middleware/auth.middleware";
import { requireActiveTenant } from "../middleware/tenant.middleware";

const router = Router();
const controller = new NotificationController();
router.use(requireAuth, requireActiveTenant);

router.get(    "/",              controller.list);
router.patch(  "/read-all",      controller.markAllAsRead);
router.delete( "/read",          controller.deleteRead);
router.delete( "/:id",           controller.delete);
router.patch(  "/:id/read",      controller.markAsRead);

export default router;