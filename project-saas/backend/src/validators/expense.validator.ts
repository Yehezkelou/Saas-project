

import z, { optional } from "zod"
import { PaginationSchema, uuidSchema } from "./shared.validator"



// Categories de depenses
// permet de classer les dépense pour les rapports
export const ExpenseCategoryEnum = z.enum([
    "SUPPLIES",     // Fornitures / matieres premieres
    "MAINTENANCE",  // Réparation / entretien 
    "SALARY",       // Salaires / primes
    "UTILITIES",    // Electricité, eau , internet
    "MARKETING",    // "Publicité, flyers, réseaux sociaux"
    "EQUIPEMENT",   // Achat de matériel
    "OTHER",        // Autre
])


// Enregitrer une depense 
export const createExpenseSchema = z.object({
    cycleId : uuidSchema, // Ratachée a la sessions du jour

    amout : z
        .number("le montant doit etre un nombre")
        .positive("Le montant doit etre positive")
        .multipleOf(0.01, "Maximum 2 décimales"),

    description: z
        .string()
        .min(3, "La description doit faire au moins 3 carateres")
        .max(300)
        .trim(),

    category : ExpenseCategoryEnum.default("OTHER")
})



// mettre a jour une depense 
export const updateExpenseSchema = z.object({
    amount : z
        .number()
        .positive("Le montant doit etre positif ")
        .multipleOf(0.01)
        .optional(),

    description : z 
        .string()
        .min(3)
        .max(300)
        .trim()
        .optional(),

    category : ExpenseCategoryEnum.optional()

})


// Filtres pour lister les depenses 
export const listExpenseQuerySchema = PaginationSchema.extend({
    cycleId : uuidSchema.optional(),
    category : ExpenseCategoryEnum.optional(),
    from : z.coerce.date().optional(),
    to : z.coerce.date().optional(),
    minAmount : z.coerce.number().positive().optional(),
    maxAmount: z.coerce.number().positive().optional()
}).refine(
    (data) => {
        if(data.from && data.to) return data.from <= data.to 
        return true
    }
)



// Type TypeScripts inférés 
export type ExpenseCategory = z.infer<typeof ExpenseCategoryEnum>;
export type createExpenseInput = z.infer<typeof createExpenseSchema>;
export type updtatExpenseInput = z.infer<typeof updateExpenseSchema>;
export type listExpenseQuery = z.infer<typeof listExpenseQuerySchema>;
