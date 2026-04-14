import z, { date, email } from "zod";
import { BusinessTypeEnum } from "./shared.validator";







// schema type zod pour l'inscription du user
// Crée à la fois un User ET son Tenant en une seule requête
export const registerSchema = z.object({

    email : z
        .email()
        .toLowerCase()
        .trim(),

    password : z 
            .string()
            .min(8, "mot de passe doit contenir au moin 8 caractere")
            .regex(/[A-Z]/, "doit contenir au moin une majuscule")
            .regex(/[0-9]/, "doit contenir au moin un chiffre"),

    confirmPassword : z.string(),

    tenantName : z 
            .string()
            .min(2, "le nom de l'etabliblement faire au moin 2 caractére")
            .max(100)
            .trim(),

    
    businessType : BusinessTypeEnum,

}).refine((data) => data.confirmPassword == data.password)


// Schema type zod pour la connexion de l'utilisateur
export const LoginSchema = z.object({
    email : z
        .email("email invalide")
        .toLowerCase()
        .trim(),


    password : z 
        .string()
        .min(1, "le mot de passe est requis")
})


// Schema type zod pour la connexion des staff
export const StaffLoginSchema = z.object({
    staffId : z.uuid("identifiant invalide"),
    pin : z
        .string()
        .length(4)
        .regex(/^\d{4}$/, "le mot de passe doit contenir que des chiffres")
})


// Schema type zod pour le changement de mot de passe
export const changePasswordSchema = z.object({
    currentPassword : z.string().min(1, "mot de passe actuel requis"),
    newPassword : z
        .string()
        .min(8, "le mot de passe doit faire 8 caractere")
        .regex(/[A-Z]/, "doit contenir au moin une lettre majuscule")
        .regex(/[0-9]/, "doit contenir au moin un chiffre"),

    confirmPassword : z.string(),
}).refine(
    (data) => data.confirmPassword == data.newPassword
)

// Schema type zod pour la renitialisation du mot de passe
export const forgotPasswordSchema = z.object({
    email : z.email("adresse email invalide").toLowerCase().trim()
}) 

// Shema type zod pour les la reniatilisation avec token
export const resetPasswordSchema = z.object({
    token : z.string().min(1, "token requis"),
    newPassword  : z
        .string()
        .min(8, "le mot de passe doit faire 8 caractéres")
        .regex(/[A-Z]/, "le mot de passe doit contenenir une majuscule")
        .regex(/[0-9]/, "le mot de passe doit contenir un chiffre"),

    confirmPassword : z.string(),
}).refine(
    (data) => data.confirmPassword == data.newPassword 
)



//Type infére Typescripte
export type registerInput = z.infer<typeof registerSchema>;
export type loginInput = z.infer<typeof LoginSchema>;
export type staffInput = z.infer<typeof StaffLoginSchema>;
export type changePasswordInput = z.infer<typeof changePasswordSchema>;
export type forgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type resetPasswordInput = z.infer<typeof resetPasswordSchema>;
