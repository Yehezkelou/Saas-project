import z from "zod";
import { uuidSchema } from "./shared.validator";







// creer un table 
export const createTableSchema = z.object({
    name : z
        .string()
        .min(2, "le nom doit contenir au moin 2 caractere")
        .max(20)
        .trim()  
})


// mettre a jour la table 
export const updateTableSchema = createTableSchema.partial().extend({
    isActive : z.boolean().optional()
})

// Params route  /table/:id
export const tableParamsSchema = z.object({
    tableId : uuidSchema
})


export type createTableInput = z.infer<typeof createTableSchema>;
export type updateTableInput = z.infer<typeof updateTableSchema>;