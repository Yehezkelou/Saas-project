import z from "zod";



// Schema zod pour les different type d'etablissement
export const BusinessTypeEnum = z.enum([
    'RESTAURANT',
    'BAR',
    'CAFE',
    'FASTFOOD'
])


// Shema type zod pour les Role utilisateur
export const UserRoleEnum = z.enum([
    "ADMIN",
    "MANAGER"
])

// Schema type zod pour les Category de produit
export const CategoryTypeEnum = z.enum([
    'FOOD',
    'DRINK'
])


//Schema type zod pour les Status du cycle
export const CycleStatusEnum = z.enum([
    'OPEN',
    'CLOSED'
])



// Schema type zod pour les status des commande
export const OrderStatusEnum = z.enum([
    'PENDIND',
    'ACCEPTED',
    'READY',
    'PAID'
])


// Schema zod pour les types de payement 
export const PayementMethodEnum = z.enum([
    'CASH',
    'CARD',
    'MOBILE_MONEY'
])


// Schema zod pour les plan de Subscrition
export const SubscriptionPlanEnum = z.enum([
    'FREE',
    'PRO',
    'BUSINESS'
])


//Schema zod pour les status de Subscrition
export const SubscriptionStatusEnum = z.enum([
    'ACTIVE',
    'SUSPENDED',
    'EXPIRED'
])

// Schema type zod pour L'UUID valide (Champ commun)
export const uuidSchema = z.uuid("Id invalide (UUID attendu)")


// Pagination schema

export const PaginationSchema = z.object({
    page : z.coerce.number().int().min(1).default(1),
    limit : z.coerce.number().int().min(1).max(100).default(20)
})


// type inferé TypeScript

export type BusinessType = z.infer<typeof BusinessTypeEnum>
export type UserRole = z.infer<typeof UserRoleEnum>;
export type CategortyType = z.infer<typeof CategoryTypeEnum>;
export type CycleStatus = z.infer<typeof CategoryTypeEnum>;
export type PayementMethod = z.infer<typeof PayementMethodEnum>;
export type  SubscriptionPlan = z.infer<typeof SubscriptionPlanEnum>;
export type SubscriptionStatus = z.infer<typeof SubscriptionStatusEnum>;
export type OrderStatus = z.infer<typeof OrderStatusEnum>;
export type paginationInput = z.infer<typeof PaginationSchema>;
