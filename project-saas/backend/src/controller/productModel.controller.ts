
import type { Request, Response } from "express";
import prisma from "../lib/prisma";

export class ProductModelController {
  // Liste des catégories
  getCategories = async (req: Request, res: Response) => {
    try {
      const categories = await prisma.productModelCategory.findMany({
        orderBy: { name: 'asc' }
      });
      return res.status(200).json({ success: true, data: categories });
    } catch (e: any) {
      return res.status(500).json({ success: false, message: e.message });
    }
  };

  // Liste des modèles par catégorie
  getModelsByCategory = async (req: Request, res: Response) => {
    try {
      const { categoryId } = req.params;
      const models = await prisma.productModel.findMany({
        where: { categoryId: categoryId as string },
        orderBy: { name: 'asc' }
      });
      return res.status(200).json({ success: true, data: models });
    } catch (e: any) {
      return res.status(500).json({ success: false, message: e.message });
    }
  };

  // Importer un modèle dans le catalogue du tenant
  importModel = async (req: Request, res: Response) => {
    try {
      const { modelId, categoryId, price } = req.body;
      const tenantId = req.tenant;

      if (!tenantId) return res.status(401).json({ success: false, message: "Non autorisé" });

      const model = await prisma.productModel.findUnique({
        where: { id: modelId }
      });

      if (!model) return res.status(404).json({ success: false, message: "Modèle non trouvé" });

      // Créer le produit pour le tenant
      const product = await prisma.product.create({
        data: {
          tenantId,
          categoryId, // Catégorie du tenant (pas la catégorie du modèle)
          name: model.name,
          price: parseFloat(price),
          unit: model.unit,
          imageUrl: model.imageUrl,
          isActive: true
        }
      });

      return res.status(201).json({ success: true, data: product, message: "Produit importé avec succès" });
    } catch (e: any) {
      return res.status(500).json({ success: false, message: e.message });
    }
  };
}
