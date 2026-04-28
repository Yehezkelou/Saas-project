import { StaffService } from "../services/staff.service";
import type { Request, Response } from "express";







export class StaffController{

    private staffService = new StaffService();
    private static errorMap: Record<string, {status : number, message : string}> = {
        "STAFF_NAME_ALREADY_EXISTS" : {status : 400, message : "Un employé avec ce nom existe déjà"},
        "STAFF_ID_ALREADY_EXISTS" : {status : 400, message : "Cet identifiant est déjà utilisé par un autre employé"},
        "STAFF_NOT_FOUND" : {status : 404, message : "L'employé n'a pas été trouvé"},
        "INVALID_PIN" : {status : 400, message : "Le code PIN est incorrect"},
        "ROLE_NOT_FOUND" : {status : 404, message : "Le rôle n'a pas été trouvé"},
    }

    // controller de liste des staff
    list = async (req : Request, res : Response ) => {
        try{
            const staff = await this.staffService.list(req.tenant!)
            return res.status(200).json({success : true, data : staff, message : "Staffs récupérés avec succés"})

        }catch(e: any){
            const err = StaffController.errorMap[e.message]
            if(err) return res.status(err.status).json({success : false, message : err.message})
            return res.status(500).json({success : false, message : "Erreur serveur"})
        }
    }

    // controller de creation des staff
    create = async (req : Request, res : Response) => {
        try{
            const staff = await this.staffService.create(req.body, req.tenant!)
            return res.status(200).json({success : true, data : staff, message : "Staff créé avec succés"})
        }catch(e : any){
            const err = StaffController.errorMap[e.message]
            if(err) return res.status(err.status).json({success : false, message : err.message})
            return res.status(500).json({success : false, message : "Erreur serveur"})
        }
    }


    // controller de mise a jour des staff
    update = async (req : Request, res : Response) => {
        try{
            const staff = await this.staffService.update(req.tenant!, req.params.id as string, req.body)
            return res.status(200).json({success : true, data : staff, message : "Staff mis a jour avec succés"})
        }catch(e : any){
            const err = StaffController.errorMap[e.message]
            if(err) return res.status(err.status).json({success : false, message : err.message})
            return res.status(500).json({success : false, message : "Erreur serveur"})
        }
    }

    // controller de change pin des staff
    changePin = async (req : Request, res : Response) => {
        try{
            const staff = await this.staffService.changePin(req.tenant!, req.params.id as string, req.body)
            return res.status(200).json({success : true, data : staff, message : "Staff mis a jour avec succés"})
        }catch(e : any){
            const err = StaffController.errorMap[e.message]
            if(err) return res.status(err.status).json({success : false, message : err.message})
            return res.status(500).json({success : false, message : "Erreur serveur"})
        }
    }

    // controller de delete des staff
    delete = async (req : Request, res : Response) => {
        try{
            const staff = await this.staffService.delete(req.tenant!, req.params.id as string)
            return res.status(200).json({success : true, data : staff, message : "Staff mis a jour avec succés"})
        }catch(e : any){
            const err = StaffController.errorMap[e.message]
            if(err) return res.status(err.status).json({success : false, message : err.message})
            return res.status(500).json({success : false, message : "Erreur serveur"})
        }
    }

    // controller de login pin des staff (via identifiant court)
    loginpin = async (req : Request, res : Response) => {
        try{
            const { identifier, pin } = req.body;
            const staff = await this.staffService.loginByIdentifier(req.tenant!, identifier, pin)
            return res.status(200).json({success : true, data : staff, message : "Staff connecté avec succés"})
        }catch(e : any){
            const err = StaffController.errorMap[e.message]
            if(err) return res.status(err.status).json({success : false, message : err.message})
            return res.status(500).json({success : false, message : "Erreur serveur"})
        }
    }
}