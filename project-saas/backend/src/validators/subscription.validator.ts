import z from "zod";
import { SubscriptionPlanEnum, SubscriptionStatusEnum, uuidSchema } from "./shared.validator";








// cree un abonnement 
export const createSubscriptionSchema = z.object({
    tenantId : uuidSchema,

    plan : SubscriptionPlanEnum,

    // Date d'expiration- claculé en fonction du plan
    expiresAt : z.coerce.date().refine(
        (date) => date > new Date(),
        "La date d'expiration doit etre dans le futur"
    )
})


// changement de plan 
export const changePlanShema = z.object({
    plan : SubscriptionPlanEnum,
})

// mettre a jour le status 
export const updateSatusSubscriptionSchema = z.object({
    status : SubscriptionStatusEnum
})


// renouveller un abonnement 
export const renewSubcriptionSchema = z.object({
    months : z 
        .number()
        .int()
        .min(1)
        .max(24)
})


// Params de route : /subscription/:id
export const subscruptionParamsSchema = z.object({
    id: uuidSchema
})


// Type TypeScript inférés
export type createSubscriptionInput = z.infer<typeof createSubscriptionSchema>;
export type changePlanInput = z.infer<typeof changePlanShema>;
export type updateStatusSubscriptionInput = z.infer<typeof updateSatusSubscriptionSchema>;
export type renewSubcriptionInput  = z.infer<typeof renewSubcriptionSchema>;
