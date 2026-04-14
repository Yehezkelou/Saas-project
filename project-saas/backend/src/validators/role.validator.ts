import z from "zod";
import { uuidSchema } from "./shared.validator";






export const AVAILABLE_PERMISSIONS = [
    //commande 
    "CREATE_ORDER", // Créer une commande 
    "VIEW_ORDERS", // Voir les commandes
    "UPDATE_ORDER_STATUS", //Changer le status d'une commande (PENDIND-ACCEPTED-READY)
    "DELETE_ORDER", // Annuler une commande

    // Paiements
    "PROCESS_PAYEMENT", // Encaisser un paiement 
    "VIEW_PAYEMENTS", // Voir les paiments 

    // produit / Menu 
    "VIEWS_PRODUCTS", // voir le menu 
    "MANAGE_PRODUCTS", // Créer / modifier / désactiver des produit

    // Stok
    "VIEW_STOCK", // Voir les stooks
    "UPDATE_STOCK", // Mettre a jour les stocks
    
    //Dépenses 
    "CREATE_EXPENSE", // Enregistrer une depense
    "VIEW_EXPENSES", // Voir les dépenses

    //Cycle / caisse
    "OPEN_CYCLE", // Ouvire la caisse
    "CLOSE_CYCLE", // Fermer la caisse
    "VIEW_REPORTS", // Voir le rapport journaliers

    // Staff 
    "MANAGE_STAFF", // Gérer les employés (ADMIN seulement)    
] as const;




// Type de permissions (union de string)
export type Permissions = typeof AVAILABLE_PERMISSIONS[number];


// Validator d'une permission individuelle
const permissionsSchema = z.enum(AVAILABLE_PERMISSIONS)


// Créer un role 
export const createRoleSchema = z.object({
    name : z
        .string()
        .min(2, "Le nom du role doit faire au moin 2 caractéres")
        .max(50, "Le nom du role ne pas depasser 50 caractéres")
        .trim()
        .toUpperCase(),
    
    permssion : z 
        .array(permissionsSchema)
        .min(1, "Un role doit avoir au moins une permission")
        .refine(
            (perms) => new Set(perms).size === perms.length,
            "Les permissions ne peuvent pas etre dubliquer" 
        ),
})

// mettre a jour un role 
export const updateRoleSchema = createRoleSchema.partial();

// Params de route : /roles/:id
export const roleParamsSchema = z.object({
    id: uuidSchema
})

//Type TypeScripts inférés
export type CreateRoleInput = z.infer<typeof createRoleSchema>;
export type updateRoleInput = z.infer<typeof updateRoleSchema>;

