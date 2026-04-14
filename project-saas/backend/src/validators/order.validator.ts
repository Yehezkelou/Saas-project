

import z from "zod";
import { OrderStatusEnum, PaginationSchema, uuidSchema } from "./shared.validator";




// Un item dans une commande 
// utilisé a l'interieur de createOrderSchema
const orderItemInputSchema = z.object({
    productId : uuidSchema,

    quantity : z  
        .number()
        .int("La quantité doit etre un nombre entier")
        .min(1, "La quantité doit etre au moins 1 ")
        .max(99, "La quantité ne peut pas depasser 99"),

})


// creer un commande 
export const createOrderSchema = z.object({

    cylceId: uuidSchema,
    tableId: uuidSchema,

    items : z 
        .array(orderItemInputSchema)
        .min(1, "LA commande doit contenir au mois un article")
        .max(50, "Une commande ne peut pas contenir plus de 50 articles")
        .refine(
            (items) => {
                const ids = items.map((i) => i.productId)
                return new Set(ids).size === ids.length

            },
            "Un produit ne peut pas apparaitre deux fois - ajustez la quantité" 
        )
})

// Ajouter des items a une commande existante
// Le client commande autre chose aprés la commande initiale
export const addOrderItemSchema = z.object({
    items : z
        .array(orderItemInputSchema)
        .min(1, "Vous devez ajouter au moins un article")

})

// modifier la quantité d'un item
export const updateOrderItemSchema = z.object({
    quantity : z
        .number()
        .int("la quantité doit etre un nombre entier")
        .min(1, "La quantité doit etre au moins 1 ")
        .max(99),
})


// changer le status de la commande 
export const updateOderStatusSchema = z.object({
    status : OrderStatusEnum,
})

// Params route : /order/:id
export const orderParamsSchema = z.object({
    id : uuidSchema,
})

// Params : /orders/:order
export const orderItemParamsSchema = z.object({
    orderId : uuidSchema,
    itemId : uuidSchema
})

// Filtres pour lister les commandes 
export const listOrderQuerySchema = PaginationSchema.extend({
    cycleId : uuidSchema.optional(),
    status : OrderStatusEnum.optional(),
    tableId : uuidSchema,

    // Filtrer par periode 
    from: z.coerce.date().optional(),
    to : z.coerce.date().optional()
}).refine(
    (data) =>  {
        if (data.from && data.to) return data.from <= data.to
        return true
    }
)


// Type TypeScript inférés 
export type createOrderInput = z.infer<typeof createOrderSchema>;
export type addOrderItemInput = z.infer<typeof addOrderItemSchema>;
export type updateOrderItemInput = z.infer<typeof updateOrderItemSchema>;
export type updateOrderStatusInput = z.infer<typeof updateOderStatusSchema>;
export type listOrdersQuery = z.infer<typeof listOrderQuerySchema>;
