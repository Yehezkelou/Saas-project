import { CycleService } from "../services/cycle.service";
import type {Request, Response} from "express"





export class CycleController {
    private service = new CycleService();
    private errorMap: Record<string, { status: number; message: string }> = {
  CYCLE_ALREADY_OPEN:  { status: 409, message: "Une caisse est déjà ouverte — fermez-la d'abord" },
  CYCLE_NOT_FOUND:     { status: 404, message: "Session de caisse introuvable" },
  HAS_UNPAID_ORDERS:   { status: 400, message: "Des commandes ne sont pas encore payées — réglez-les avant de fermer" },
};


    // get active 
    getActive = async (req : Request, res : Response) => {
        try{
            const cycle = await this.service.getActive(req.tenant!)
            return res.status(200).json({success : true, data : cycle, message : "Cycle actif récupéré avec succés"})
        }catch(e : any){
            const err = this.errorMap[e.message]
            if(err) return res.status(err.status).json({success : false, message : err.message})
            return res.status(500).json({success : false, message : "Erreur serveur"})
        }
    }

    // open 
    open = async (req : Request, res : Response) => {
        try{
            const cycle = await this.service.open(req.tenant!, req.body)
            return res.status(200).json({success : true, data : cycle, message : "Cycle ouvert avec succés"})
        }catch(e : any){
            const err = this.errorMap[e.message]
            if(err) return res.status(err.status).json({success : false, message : err.message})
            return res.status(500).json({success : false, message : "Erreur serveur"})
        }
    }

    // close 
    close = async (req : Request, res : Response) => {
        try{
            const cycle = await this.service.close(req.tenant!, req.params.id as string, req.body)
            return res.status(200).json({success : true, data : cycle, message : "Cycle fermé avec succés"})
        }catch(e : any){
            console.error("[CycleController.close] Error:", e);
            const err = this.errorMap[e.message]
            if(err) return res.status(err.status).json({success : false, message : err.message})
            return res.status(500).json({success : false, message : "Erreur serveur"})
        }
    }

    // list 
    list = async (req : Request, res : Response) => {
        try{
            const cycles = await this.service.list(req.tenant!)
            return res.status(200).json({success : true, data : cycles, message : "Cycles récupérés avec succés"})
        }catch(e : any){
            const err = this.errorMap[e.message]
            if(err) return res.status(err.status).json({success : false, message : err.message})
            return res.status(500).json({success : false, message : "Erreur serveur"})
        }
    }

    // rapport detaillé
    detailedReport = async (req : Request, res : Response) => {
        try{
            const cycle = await this.service.getRaport(req.tenant!, req.params.id as string)
            return res.status(200).json({success : true, data : cycle, message : "Rapport détaillé récupéré avec succés"})
        }catch(e : any){
            const err = this.errorMap[e.message]
            if(err) return res.status(err.status).json({success : false, message : err.message})
            return res.status(500).json({success : false, message : "Erreur serveur"})
        }
    }

    
}
