import z from "zod"
import { CycleStatusEnum, PaginationSchema, uuidSchema } from "./shared.validator";







//Ouvrir une caisse 
// simple : on demare une nouvelle session
export const  openCycleSchema = z.object({
    //fond de caisse initial (optionnel)
    openingCash : z 
        .number()
        .nonnegative("Le fond de caisse ne peut etre negatif")
        .multipleOf(0.01)
        .optional()
});



// Fermer une caisse 
// Le caissier renseigne l'argent physiquement compté
// Le systéme compare avec le théorique pour detecter les ecarts

export const closeCycleSchema = z.object({
    // Montant physiquement compté dans la classe
    closingCash: z
        .number()
        .nonnegative("Le montant de cloture ne peut pas etre négatif")
        .multipleOf(0.01),
    
    notes : z 
        .string()
        .max(500, "Les notes ne peuvent pas depasser 500 caracteéres")
        .trim()
        .optional(),
})

// Params de route : /cycle/:id
export const cycleParamsSchema = z.object({
    id: uuidSchema
})

// Filtres pour lister les cycles 
export const cycleListQuerySchema = PaginationSchema.extend({
    status: CycleStatusEnum.optional(),
    from: z.coerce.date().optional(),
    to: z.coerce.date().optional()
})

// Type TypeScripts inférés 
export type OpenCycleInput = z.infer<typeof openCycleSchema>;
export type closeCycleInput = z.infer<typeof closeCycleSchema>;
export type listCyclesQuery = z.infer<typeof cycleListQuerySchema>; 
