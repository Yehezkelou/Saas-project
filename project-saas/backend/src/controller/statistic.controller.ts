import type { Request, Response } from "express";
import { StatisticService } from "../services/statistic.service";

export class StatisticController {
  private service = new StatisticService();
  private errorMap: Record<string, { status: number; message: string | ((args: any) => string) }> = {
    INVALID_DATES: { status: 400, message: "Dates invalides. Utilisez le format ISO." },
    START_DATE_AFTER_END_DATE: { status: 400, message: "La date de début doit être antérieure à la date de fin." },
    INVALID_PLAN: { status: 403, message: "Plan d'abonnement invalide." },
  };

  calculate = async (req: Request, res: Response) => {
    try {
      const { startDate, endDate } = req.body;
      if (!startDate || !endDate) {
        return res.status(400).json({ success: false, message: "startDate et endDate sont requis." });
      }

      const statistic = await this.service.calculateStatistics(req.tenant!, startDate, endDate);
      return res.status(200).json({ success: true, data: statistic, message: "Statistiques calculées avec succès." });
    } catch (e: any) {
      if (e.message.startsWith("STATISTIC_DAYS_LIMIT_EXCEEDED:")) {
        const limit = e.message.split(":")[1];
        return res.status(403).json({
          success: false,
          message: `Limite atteinte : votre plan vous limite à un calcul de statistiques sur une période maximale de ${limit} jours.`
        });
      }

      const err = this.errorMap[e.message];
      if (err) return res.status(err.status).json({ success: false, message: typeof err.message === 'function' ? err.message({}) : err.message });
      return res.status(500).json({ success: false, message: "Erreur serveur: " + e.message });
    }
  };

  list = async (req: Request, res: Response) => {
    try {
      const statistics = await this.service.list(req.tenant!);
      return res.status(200).json({ success: true, data: statistics, message: "Statistiques récupérées avec succès." });
    } catch (e: any) {
      return res.status(500).json({ success: false, message: "Erreur serveur" });
    }
  };
}
