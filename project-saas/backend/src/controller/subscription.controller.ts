// SUBSCRIPTION CONTROLLER
import type { Request, Response } from "express";
import { SubscriptionService } from "../services/subscription.service";

const errorMap: Record<string, (e: any) => { status: number; message: string }> = {
  SUBSCRIPTION_NOT_FOUND: () => ({ status: 404, message: "Abonnement introuvable" }),
  ALREADY_ON_THIS_PLAN:   () => ({ status: 400, message: "Vous êtes déjà sur ce plan" }),
  DOWNGRADE_BLOCKED: (e) => {
    // Format : DOWNGRADE_BLOCKED:staff:5:2
    const [, resource, current, limit] = e.message.split(":");
    return {
      status: 400,
      message: `Downgrade impossible : vous avez ${current} ${resource} actifs, le plan cible en autorise ${limit}. Réduisez votre usage d'abord.`,
    };
  },
};

export class SubscriptionController {

    private service = new SubscriptionService();

  get = async (req: Request, res: Response) => {
    try {
      const data = await this.service.getWithUsage(req.tenant!);
      return res.json({ success: true, data });
    } catch (e: any) {
      const handler = errorMap[e.message];
      if (handler) {
        const err = handler(e);
        return res.status(err.status).json({ success: false, message: err.message });
      }
      return res.status(500).json({ success: false, message: "Erreur serveur" });
    }
  }

  changePlan = async (req: Request, res: Response) => {
    try {
      const subscription = await this.service.changePlan(
        req.tenant!, req.body
      );
      return res.json({ success: true, data: subscription });
    } catch (e: any) {
      if (e.message?.startsWith("DOWNGRADE_BLOCKED")) {
        const handler = errorMap["DOWNGRADE_BLOCKED"];
        const err = handler!(e);
        return res.status(err.status).json({ success: false, message: err.message });
      }
      const handler = errorMap[e.message];
      if (handler) {
        const err = handler(e);
        return res.status(err.status).json({ success: false, message: err.message });
      }
      return res.status(500).json({ success: false, message: "Erreur serveur" });
    }
  }

  renew = async (req: Request, res: Response) => {
    try {
      const subscription = await this.service.renew(
        req.tenant!, req.body
      );
      return res.json({ success: true, data: subscription });
    } catch (e: any) {
      const handler = errorMap[e.message];
      if (handler) {
        const err = handler(e);
        return res.status(err.status).json({ success: false, message: err.message });
      }
      return res.status(500).json({ success: false, message: "Erreur serveur" });
    }
  }

  // LOGIQUE SUPER ADMIN
  listAll = async (req: Request, res: Response) => {
    try {
      const data = await this.service.listAllWithTenants();
      return res.json({ success: true, data });
    } catch (e: any) {
      return res.status(500).json({ success: false, message: "Erreur serveur" });
    }
  }

  verify = async (req: Request, res: Response) => {
    try {
      const data = await this.service.verifySubscription(req.params.tenantId as string);
      return res.json({ success: true, data });
    } catch (e: any) {
      return res.status(500).json({ success: false, message: "Erreur serveur" });
    }
  }

  suspend = async (req: Request, res: Response) => {
    try {
      await this.service.suspend(req.params.tenantId as string);
      return res.json({ success: true, message: "Abonnement suspendu" });
    } catch (e: any) {
      return res.status(500).json({ success: false, message: "Erreur serveur" });
    }
  }

  deleteTenant = async (req: Request, res: Response) => {
    try {
      await this.service.deleteTenant(req.params.tenantId as string);
      return res.json({ success: true, message: "Établissement supprimé définitivement" });
    } catch (e: any) {
      return res.status(500).json({ success: false, message: "Erreur serveur" });
    }
  }

  getStats = async (req: Request, res: Response) => {
    try {
      const data = await this.service.getGlobalStats();
      return res.json({ success: true, data });
    } catch (e: any) {
      console.error("[getStats Error]:", e);
      return res.status(500).json({ success: false, message: "Erreur serveur" });
    }
  }

  activate = async (req: Request, res: Response) => {
    try {
      await this.service.activate(req.params.tenantId as string);
      return res.json({ success: true, message: "Abonnement réactivé" });
    } catch (e: any) {
      return res.status(500).json({ success: false, message: "Erreur serveur" });
    }
  }

  reject = async (req: Request, res: Response) => {
    try {
      await this.service.rejectPlanChange(req.params.tenantId as string);
      return res.json({ success: true, message: "Demande de changement de plan rejetée" });
    } catch (e: any) {
      return res.status(500).json({ success: false, message: "Erreur serveur" });
    }
  }

  adminChangePlan = async (req: Request, res: Response) => {
    try {
      const { plan } = req.body;
      await this.service.adminChangePlan(req.params.tenantId as string, plan);
      return res.json({ success: true, message: "Plan modifié avec succès" });
    } catch (e: any) {
      return res.status(500).json({ success: false, message: "Erreur serveur" });
    }
  }
};