import z from "zod";
import { BusinessTypeEnum, uuidSchema } from "./shared.validator";






// creer un etablissment 
// appelé lors de l'inscription : un utilisateur crée son compte
// et un tenant est automatiquement crée avec.
export const createTenantSchema = z.object({
    name : z
        .string()
        .min(2, "le nom doit faire au moin 2 caratéres")
        .max(100, "le nom ne peut pas depasser 100 caratéres")
        .trim(),
    
    BusinessType : BusinessTypeEnum
})


//mettre a jour un etablissement 
// modifier les information (optionnel)

export const updateTenantSchema = createTenantSchema.partial()


// params de route : /tenant/:id
export const tenantParamsShema = z.object({
    id : uuidSchema,
})


//Type TypeScript inférés
export type createTenantInput = z.infer<typeof createTenantSchema>;
export type updateTenantInput = z.infer<typeof updateTenantSchema>;

