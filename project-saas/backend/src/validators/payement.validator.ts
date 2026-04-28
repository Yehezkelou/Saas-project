import z from "zod";
import { PaginationSchema, PayementMethodEnum, uuidSchema } from "./shared.validator";




// Enregistrement un paiment 
export const createPayementSchema = z.object({
    orderId : uuidSchema, // quel commende est reglée

    method : PayementMethodEnum, // CASH , CARD, MOBILE_MONEY

    amount : z 
        .number()
        .positive()
        .multipleOf(0.01),

    // pour mobile money : numero de telephone ou reference transaction
    reference : z 
        .string()
        .max(100, "La référence ne peut pas depaseer 100 caractéres")
        .trim()
        .optional(),

})



export const splitPayementSchema = z.object({
    orderId : uuidSchema,

    payements : z
        .array(
            z.object({
                method : PayementMethodEnum,
                amout : z
                    .number()
                    .positive("Chaque montant doit etre positif")
                    .multipleOf(0.01),
                reference : z.string().max(100).optional()
                    
            })
        )
        .min(2, "Un Paiment fractionné nécessite au moins 2 méthodes")
        .max(3, "Maximum 3 methode de paiment"),
})




// Params de route : /payement/:id 
export const payementParamsSchema = z.object({
    id : uuidSchema,
})



// Filtres pour lister les paiment 
export const listPayementQuerySchema = PaginationSchema.extend({
    orderId: uuidSchema.optional(),
    method : PayementMethodEnum.optional(),
    from : z.coerce.date().optional(),
    to: z.coerce.date().optional()
})



// Type TypeScipts inférés 
export type createPayementInput = z.infer<typeof createPayementSchema>;
export type splitPayementInput = z.infer<typeof splitPayementSchema>;
export type listPayementQuery = z.infer<typeof listPayementQuerySchema>;