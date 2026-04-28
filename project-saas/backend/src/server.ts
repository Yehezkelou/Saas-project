// =============================================================
//  APP.TS — Version Phase 3 complète
//  Ajout : subscription, notifications, cron jobs
// =============================================================

import express from "express"; // Refonte branding Saas v1.1 - Stabilization Complete
import cors from "cors";
import helmet from "helmet";
import "dotenv/config";
import path from "path";

// Phase 1
import authRoutes from "./routes/auth.routes";
import logger from "./lib/logger";
import { httpLogger } from "./middleware/logger.middleware";

// Phase 2
import roleRoutes         from "./routes/role.routes";
import staffRoutes        from "./routes/staff.routes";
import categoryRoutes     from "./routes/category.routes";
import productRoutes      from "./routes/product.routes";
import tableRoutes        from "./routes/table.routes";
import cycleRoutes        from "./routes/cycle.routes";
import orderRoutes        from "./routes/order.routes";
import paymentRoutes      from "./routes/payement.routes";
import expenseRoutes      from "./routes/expense.route";

// Phase 3
import subscriptionRoutes  from "./routes/subscription.routes";
import notificationRoutes  from "./routes/notification.routes";
import uploadRoutes        from "./routes/upload.routes";
import statisticRoutes     from "./routes/statistic.routes";
import productModelRoutes  from "./routes/productModel.routes";
import { startCronJobs }   from "./lib/cron";

const app = express();

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      ...helmet.contentSecurityPolicy.getDefaultDirectives(),
      "img-src": ["'self'", "data:", "*"],
    },
  },
  crossOriginResourcePolicy: { policy: "cross-origin" },
  crossOriginEmbedderPolicy: false
}));
app.use(cors({ origin:"*", credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(httpLogger); // Middleware de monitoring HTTP

// Servir statiquement le dossier des uploads pour afficher les images côté client
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

app.get("/health", (_, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

const v1 = "/api/v1";

// Phase 1
app.use(`${v1}/auth`,           authRoutes);

// Phase 2
app.use(`${v1}/roles`,          roleRoutes);
app.use(`${v1}/staff`,          staffRoutes);
app.use(`${v1}/categories`,     categoryRoutes);
app.use(`${v1}/products`,       productRoutes);
app.use(`${v1}/tables`,         tableRoutes);
app.use(`${v1}/cycles`,         cycleRoutes);
app.use(`${v1}/orders`,         orderRoutes);
app.use(`${v1}/payments`,       paymentRoutes);
app.use(`${v1}/expenses`,       expenseRoutes);

// Phase 3
app.use(`${v1}/subscription`,   subscriptionRoutes);
app.use(`${v1}/notifications`,  notificationRoutes);
app.use(`${v1}/upload`,         uploadRoutes);
app.use(`${v1}/statistics`,     statisticRoutes);
app.use(`${v1}/product-models`, productModelRoutes);

// 404
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.method} ${req.path} introuvable` });
});

// Erreur globale
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  logger.error(`Erreur non gérée : ${err.message}`);
  res.status(500).json({ success: false, message: "Erreur serveur interne" });
});

const PORT = 3000;
app.listen(PORT, "0.0.0.0",() => {
  logger.info(`Serveur démarré sur http://0.0.0.0:${PORT}`);
  // Démarrer les cron jobs uniquement en production
 // if (process.env.NODE_ENV === "production") {
   // startCronJobs();
 // }
});

export default app;