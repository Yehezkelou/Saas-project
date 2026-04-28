import z from "zod";
import { PaginationSchema, uuidSchema } from "./shared.validator";




// creer un employer 
export const createStaffSchema = z.object({
    name : z
        .string()
        .min(2, "Le prenom/nom doit faire au moin 2 caractéres")
        .max(100)
        .trim(),
    
    roleId : uuidSchema, // reference vers un role existant du tenant 

    pin : z
        .string()
        .length(4, "le PIN doit faire exactement 4 chiffre")
        .regex(/^\d{4}$/, "doit contenir que des chiffres"),
    
    identifier : z
        .string()
        .min(2, "L'identifiant doit faire au moins 2 caractères")
        .trim(),
        
})


// mettre a jour un employé 
export const updateStaffSchema  = z.object({
    name : z
        .string()
        .min(2, "le prenom/nom doit faire au moin 2 caractéres")
        .max(100)
        .trim()
        .optional(),

    identifier : z
        .string()
        .min(2, "L'identifiant doit faire au moins 2 caractères")
        .trim()
        .optional(),

    roleId : uuidSchema.optional(),
    pin : z
        .string()
        .length(4, "le PIN doit faire exactement 4 chiffre")
        .regex(/^\d{4}$/, "doit contenir que des chiffres")
        .optional(),
})


// Changer le code pin d'un employer
export const changeStaffPinSchema = z.object({
    staffId : uuidSchema.optional(),
    currentPin : z
        .string()
        .length(4, "le code PIN doit exactement faire 4 chiffres")
        .regex(/^\d{4}$/, "doit contenir seulement des chiffres "),

    newPin : z
        .string()
        .length(4, "le code PIN doit exactement faire 4 chiffres")
        .regex(/^\d{4}$/, "le code PIN doit contenir seulement des chiffres "),

    confirmPin : z.string().length(4),
}).refine(
    (data) => data.currentPin == data.newPin
)
.refine(
    (data) => data.newPin !== data.currentPin
)



// Params de route  : /staff/:id
export const staffParams = z.object({
    id : uuidSchema
})

// Filtres pour lister les employés 
export const listStaffQuerySchema = PaginationSchema.extend({
    roleId: uuidSchema.optional(), // filtrer par role
    search: z.string().trim().optional()// Rechercher par nom
})

//Type TypeScripte inférés
export type createStaffInput = z.infer<typeof createStaffSchema>;
export type updateStaffInput = z.infer<typeof updateStaffSchema>;
export type changePinStaffPinInput = z.infer<typeof changeStaffPinSchema>;
export type listeStaffQuery = z.infer<typeof listStaffQuerySchema>;








