import type { Request, Response } from "express";
import logger from "../lib/logger";

export const uploadImage = (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: "Aucun fichier fourni" });
    }

    // On retourne l'URL relative qui sera accessible via le backend
    // Ex: /uploads/image-12345.png
    const fileUrl = `/uploads/${req.file.filename}`;

    res.status(200).json({
      success: true,
      data: {
        url: fileUrl,
        filename: req.file.filename
      }
    });
  } catch (error: any) {
    logger.error(`Erreur d'upload : ${error.message}`);
    res.status(500).json({ success: false, message: "Erreur lors du téléversement" });
  }
};
