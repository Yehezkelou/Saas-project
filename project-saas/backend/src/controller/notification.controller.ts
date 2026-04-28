// NOTIFICATION CONTROLLER
import type { Request, Response } from "express";
import { NotificationService } from "../services/notification.service";

export class NotificationController {

    private services = new NotificationService();

  list = async (req: Request, res: Response) => {
    try {
      const onlyUnread = req.query.unread === "true";
      const data = await this.services.list(req.tenant!, onlyUnread);
      return res.json({ success: true, data });
    } catch {
      return res.status(500).json({ success: false, message: "Erreur serveur" });
    }
  }

  markAsRead = async (req: Request, res: Response) => {
    try {
      const notification = await this.services.markAsRead(req.tenant!, { id: req.params.id as string });
      return res.json({ success: true, data: notification });
    } catch (e: any) {
      if (e.message === "NOTIFICATION_NOT_FOUND") {
        return res.status(404).json({ success: false, message: "Notification introuvable" });
      }
      return res.status(500).json({ success: false, message: "Erreur serveur" });
    }
  }

  markAllAsRead = async (req: Request, res: Response) => {
    try {
      const result = await this.services.markAllAsRead(req.tenant!);
      return res.json({ success: true, data: result });
    } catch {
      return res.status(500).json({ success: false, message: "Erreur serveur" });
    }
  }

  delete = async (req: Request, res: Response) => {
    try {
      await this.services.delete(req.tenant!, req.params.id as string);
      return res.json({ success: true, message: "Notification supprimée" });
    } catch (e: any) {
      if (e.message === "NOTIFICATION_NOT_FOUND") {
        return res.status(404).json({ success: false, message: "Notification introuvable" });
      }
      return res.status(500).json({ success: false, message: "Erreur serveur" });
    }
  }

  deleteRead = async (req: Request, res: Response) => {
    try {
      const result = await this.services.deleteRead(req.tenant!);
      return res.json({ success: true, data: result });
    } catch {
      return res.status(500).json({ success: false, message: "Erreur serveur" });
    }
  }
};