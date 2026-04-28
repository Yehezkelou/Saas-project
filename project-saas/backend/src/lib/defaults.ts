
import { BusinessType } from "../../generated/prisma/enums";


// ROLE PAR DEFAUT SELON LE TYPE D'ETABLISSEMENT
// Chaque type d'etablissement a ses propres roles metier 
// Le proprietaire peut les modifier aprés, mais il demarre
// avec quelque chose prete a l'emploie

export type Role = {
    name : string,
    permissions: string[]
}


export function getDefaultRoles(businessType : BusinessType): Role[]{
    const BASE_PERMISSIONS = [
        "VIEW_ORDERS",
        "VIEW_PRODUCTS",
        "VIEW_STOCKS"
    ];

    const roles: Record<string , Role[]> = {
        
        // role concernant les restaurant 
        RESTAURANT: [
            {
                name : "SERVEUR",
                permissions : [...BASE_PERMISSIONS, "CREATE_ORDER", "UPDATE_ORDER_STATUS"],
            },
            {
                name : "CHEF",
                permissions : [...BASE_PERMISSIONS, "UPDATE_ORDER_STATUS", "UPDATE_STOCK"],
            },
            {
                name : "CAISSIER",
                permissions : [...BASE_PERMISSIONS, "PROCESS_PAYEMENT", "VIEW_PAYEMENTS", "OPEN_CYCLE", "CLOSE_CYCLE", "CREATE_EXPENSE"]
            }
        ],

        // role concernant les bar
        BAR : [
            {
                name: "BARMAN",
                permissions : [...BASE_PERMISSIONS, "CREATE_ORDER", "UPDATE_ORDER_STATUS", "UPDATE_STOCK"],
            },
            {
                name : "CAISSIER", 
                permissions : [...BASE_PERMISSIONS, "PROCESS_PAYEMENT", "VIEW_PAYEMENTS", "OPEN_CYCLE", "CLOSE_CYCLE", "CREATE_EXPENSE"],
            },
        ], 
    }

    return roles[businessType] ?? []
}


// Categorie par defaut selon le type d'etablissement
export function getDefaultCategories(businessType : BusinessType){
    const CATEGORIESBYTYPE = {
        RESTAURANT : [
            {name : "Entrées", type : "FOOD" as const},
            {name : "Plats", type : "FOOD" as const},
            {name : "Desserts", type : "FOOD" as const},
            {name : "Boissons", type : "DRINK" as const},
        ],
        BAR: [
            {name : "Cocktails", type : "DRINK" as const},
            {name : "Bieres", type : "DRINK" as const},
            {name : "Softs", type : "DRINK" as const},
            {name : "Snacks", type : "FOOD" as const},
        ], 
        CAFE : [],
        FASTFOOD : []
    }

    return CATEGORIESBYTYPE[businessType] ?? []
}


// Abonnement par defaut
export function getDefaultSubscription(){
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 30); // +30 jours
    return {
        plan : "FREE" as const,
        status : "PENDING" as const,
        expiresAt
    }
}
