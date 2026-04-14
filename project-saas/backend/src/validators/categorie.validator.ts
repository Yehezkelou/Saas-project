import z from "zod";
import { CategoryTypeEnum, uuidSchema } from "./shared.validator";






// creer un categorie 
export const createCategorieSchema = z.object({
    name : z
        .string()
        .min(2, "le nom de la categorie dois faire au moin 2 caratéres")
        .max(80, "le nom ne peut pas depasser 80 caratéres")
        .trim(),

    type : CategoryTypeEnum, 
})


// mettre a jour une categorie 

export const updateCategorieSchema = createCategorieSchema.partial();


// Params de route : categories/:id
export const categoryParamsSchema = z.object({
    id : uuidSchema,
})

// Filtre pour liters les categories
export const listCategoriesQuerySchema = z.object({
    type : CategoryTypeEnum.optional() // Filtrer par Food ou Drink
})



// Type TypeScripts inféré 
export type createCategorieInput = z.infer<typeof createCategorieSchema>;
export type updateCategorieInput = z.infer<typeof updateCategorieSchema>;
export type listCategorieQuery = z.infer<typeof listCategoriesQuerySchema>;


