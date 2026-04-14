import z from "zod";
import { PaginationSchema, UserRoleEnum, uuidSchema } from "./shared.validator";



//Inviter un manager 
// le proprietaire (ADMIN) peut inviter un manager dans sont tenant
export const inviteUserSchema = z.object({
    email : z
        .email("Adresse email invalide")
        .toLowerCase()
        .trim(),

    role : UserRoleEnum,
})

//Mettre a jour le role utilisateur
export const updateUserSchema = z.object({
    role : UserRoleEnum,
})

//params de route : /user/:id
export const UserParamsSchema = z.object({
    id : uuidSchema
})

// filtres pour liser les users 
export const listUsersQuerySchema = PaginationSchema.extend({
    role : UserRoleEnum.optional()
})


// Type TypeScript inférés
export type InviteUserInput = z.infer<typeof inviteUserSchema>;
export type UpdateUserRoleInput = z.infer<typeof updateUserSchema>;
export type listUsersQuery = z.infer<typeof listUsersQuerySchema>;



