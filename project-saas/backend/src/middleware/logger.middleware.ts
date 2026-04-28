import type { Request, Response, NextFunction } from "express";
import logger from "../lib/logger";

/**
 * Middleware pour monitorer les requêtes HTTP entrantes
 */
export const httpLogger = (req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  const { method, url } = req;

  // Intercepter la fin de la requête pour logger le statut et le temps
  res.on("finish", () => {
    const duration = Date.now() - start;
    const { statusCode } = res;

    // Choix du niveau de log selon le code statut
    let level = "info";
    if (statusCode >= 400 && statusCode < 500) level = "warn";
    if (statusCode >= 500) level = "error";

    // Format du message
    const message = `${method} ${url} | Status: ${statusCode} | Time: ${duration}ms`;
    
    (logger as any)[level](message);
  });

  next();
};
