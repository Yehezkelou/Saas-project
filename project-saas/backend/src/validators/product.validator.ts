import z, { number } from "zod";
import { PaginationSchema, uuidSchema } from "./shared.validator";





export const createProductSchema = z.object({
    name: z 
    .string()
    .min(2, "le nom doit contenir au moin 2 caractére")
    .max(150, "le nom ne peut pas depasser 150 caractéres")
    .trim(),

    price : z 
        .number()
        .positive("le Prix doit etre positive")
        .multipleOf(0.01, "Le prix ne peut pas avoir plus de 2 décimales"),

    costPrice : z
        .number()
        .nonnegative("Le prix de revient ne peut pas etre négatif")
        .default(0),

    stock : z 
        .number()
        .int()
        .nonnegative("le stock doit etre un nombre entier")
        .default(0),

    
    minStock : z
        .number()
        .int()
        .nonnegative("le stock minimum ne doit pas etre negtif")
        .default(5),

    
    isActive : z.boolean().default(true)
}).refine(
    (data) => data.costPrice == data.price
)


// mettre a jour un produit 
export const updateProduitSchema = createProductSchema
    .omit({stock : true}) // le stock se met a jour via adjustStockSchema
    .partial();


// Ajustement du stock 
// Entrée de stock (Livraison fournisseur) ou correction manuelle

export const adjustStockSchema = z.object({
    quantity : z
        .number()
        .int("La quantité doit etre un nombre entier")
        .refine((n) => n !== 0, "La quantité ne peut pas etre 0"),

    // Positif = entrée de stock ,Négatif = sortie/correction


    reason : z
        .string()
        .min(3, "la raison doit faire au moin 3 caratéres")
        .max(100)
        .trim()
        .optional(),
});



// Params de route : /products/:id
export const productParamsSchema = z.object({
    id : uuidSchema
})

// Filtre pour lister les produits
export const listProductQuerySchema = PaginationSchema.extend({
    categoryId : uuidSchema.optional(),
    isActive : z.coerce.boolean().optional(),
    lowStock : z.coerce.boolean().optional(),
    search : z.string().trim().optional()
})


// Type Typescript inférés
export type createProductInput = z.infer<typeof createProductSchema>;
export type updateProductInput = z.infer<typeof updateProduitSchema>;
export type ajustProductInput = z.infer<typeof adjustStockSchema>;
export type listProductQuery = z.infer<typeof listProductQuerySchema>;


