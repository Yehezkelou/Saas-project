import z from "zod";
import { PaginationSchema, uuidSchema } from "./shared.validator";




// Type de notifications 

export const NotificationTypeEnum = z.enum([
    "LOW_STOCK",                // Stock d'un produit en dessous du seuil
    "NEW_ORDER",                // Nouvelle commande recue 
    "ORDER_READY",              // Commande prete a etre servie
    "SUBSCRIPTION_EXPIRY",      // Abonement qui expire bientot 
    "CYCLE_REMINDER",           // Rappel de fermer la caisse 
    "SYSTEM",                   // Message syteme generale
])


// Creer une notification (usage interne / service)

export const createNotificationSchema = z.object({
    tenantId : uuidSchema,

    type : NotificationTypeEnum,

    title : z 
        .string()
        .min(2)
        .max(100)
        .trim(),

    message : z
        .string()
        .min(5, "Le message doit faire au moins 5 carateres")
        .max(500, "Le messag ne peut pas depasser 500 caractéres")
        .trim()
})



// Marquer comme lue 
// L'utilisateur clique sur une otification pour la lire
export const markNotificationReadSchema = z.object({
    id : uuidSchema
})

// Marquer plusieur notification comme lues
export const markManyNotificationReadSchema = z.object({
    id : uuidSchema
})


// Filtres pour lister les notifications 
export const listNotificationQuerySchema = PaginationSchema.extend({
    isRead : z.coerce.boolean().optional(),
    type : NotificationTypeEnum.optional()
})



// Type TypeScripts inférés
export type NotificationType = z.infer<typeof NotificationTypeEnum>;
export type createNotificationInput = z.infer<typeof createNotificationSchema>;
export type listeNotificationQuery = z.infer<typeof listNotificationQuerySchema>;