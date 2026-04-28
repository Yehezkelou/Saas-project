import { Router } from "express";
import { uploadMiddleware } from "../middleware/upload.middleware";
import { uploadImage } from "../controller/upload.controller";

const router = Router();

// Route pour l'upload d'image, un seul fichier à la fois sous le champ 'image'
router.post("/", uploadMiddleware.single("image"), uploadImage);

export default router;
