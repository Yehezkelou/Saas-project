import type { Request, Response } from "express";
import { TableService } from "../services/table.service";


export class TableController {

    private tableService = new TableService()
    private errorMap: Record<string, { status: number; message: string }> = {
        TABLE_NOT_FOUND:        { status: 404, message: "Table introuvable" },
        QR_INVALIDE:            { status: 400, message: "QR code non reconnu" },
        TABLE_INACTIVE:         { status: 400, message: "Cette table n'est plus disponible" },
        ETABLISSEMENT_SUSPENDU: { status: 403, message: "L'établissement est temporairement fermé" },
        SUBSCRIPTION_SUSPENDED: { status: 403, message: "L'abonnement de cet établissement est expiré ou suspendu" },
    };
    
  // liste des tables
  list = async (req: Request, res: Response) => {
    try {
      const tables = await this.tableService.list(req.tenant!);
      return res.json({ success: true, data: tables });
    } catch {
      return res.status(500).json({ success: false, message: "Erreur serveur" });
    }
  }

  create = async (req: Request, res: Response) => {
    try {
      const table = await this.tableService.create(req.tenant!, req.body);
      return res.status(201).json({ success: true, data: table });
    } catch (e: any) {
      const err = this.errorMap[e.message];
      if (err) return res.status(err.status).json({ success: false, message: err.message });
      return res.status(500).json({ success: false, message: "Erreur serveur" });
    }
  }

  update = async (req: Request, res: Response) => {
    try {
      const table = await this.tableService.update(req.tenant!, req.params.id as string, req.body);
      return res.json({ success: true, data: table });
    } catch (e: any) {
      const err = this.errorMap[e.message];
      if (err) return res.status(err.status).json({ success: false, message: err.message });
      return res.status(500).json({ success: false, message: "Erreur serveur" });
    }
  }

  regenerateQr = async (req: Request, res: Response) => {
    try {
      const result = await this.tableService.regenerateQrCode(req.tenant!, req.params.id as string);
      return res.json({ success: true, data: result });
    } catch (e: any) {
      const err = this.errorMap[e.message];
      if (err) return res.status(err.status).json({ success: false, message: err.message });
      return res.status(500).json({ success: false, message: "Erreur serveur" });
    }
  }

  // Route PUBLIQUE — appelée quand le client scanne le QR
  scanQr = async (req: Request, res: Response) => {
    try {
      const result = await this.tableService.createTableSession(req.params.qrToken as string);
      return res.json({ success: true, data: result });
    } catch (e: any) {
      const err = this.errorMap[e.message];
      if (err) return res.status(err.status).json({ success: false, message: err.message });
      return res.status(500).json({ success: false, message: "Erreur serveur" });
    }
  }
};