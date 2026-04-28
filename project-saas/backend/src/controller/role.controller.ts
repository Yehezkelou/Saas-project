import type { Request, Response } from "express";
import { RoleService } from "../services/role.service";






export class RoleController{

    private  service = new RoleService()
    private  errorMap : Record<string, {status : number , message : string}> = {
        ROLE_ALRAEDY : {status : 400, message : "Le role existe déjà"},
        ROLE_NOT_FOUND : {status : 404, message : "Le role n'a pas été trouvé"},
        ROLE_HAS_STAFF : {status : 400, message : "Le role a des employés - réassigner les avant de supprimer"},
    }


    list = async (req: Request, res : Response) => {
        try{
            const role = await this.service.getAllRoles(req.tenant!)
            return res.status(200).json({success : true, data : role, message : "Roles récupérés avec succés"})
        }catch(e: any){
            const err = this.errorMap[e.message]
            if(err) return res.status(err.status).json({success : false , message : err.message})

            return res.status(500).json({success : false, message : "Erreur serveur"})
        }
    }

    // controller de la creation du role
    createRole = async (req: Request, res : Response) => {
    
        try {
            const role = await this.service.creatRole(req.body, req.tenant!)
            return res.status(201).json({success : true, data : role, message : "Role créé avec succes"})
        }catch(e: any){
            const err = this.errorMap[e.message]
            if(err) return res.status(err?.status).json({success : false , message : err.message})
                
            return res.status(500).json({success : false, message : "Erreur serveur"})
        }
    }


    // controller de la mise a jour du role 
    updateRole = async (req: Request, res : Response) => {
        try {
            const role = await this.service.updateRole(req.tenant!, req.params.id as string, req.body)
            return res.status(201).json({success : true, data : role, message : "role mis a jour avec succés"})
             
            }catch(e: any){
                const err = this.errorMap[e.message]
                if(err) return res.status(err.status).json({success : false , message : err.message})

                return res.status(500).json({success : false, message : "Erreur serveur"})
            }
        }
    
    // controller du delete 
    deleteRole = async (req: Request, res: Response) => {
        try{
            const role = await this.service.deleteRole(req.tenant!, req.params.id as string)
            return res.status(201).json({ success : true , data : role, message : "role suprimé avec succés"})
        }catch(e: any){
            const err = this.errorMap[e.message]
            if(err) return res.status(err.status).json({success : false , message : err.message})

            return res.status(500).json({success : false, message : "Erreur serveur"})
        }
    }
}