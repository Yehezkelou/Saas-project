import { ExpenseService } from "../services/expense.service";
import type { Request, Response } from "express";





export class ExpenseController {
    private service = new ExpenseService()
    private errorMap: Record<string, { status: number; message: string }> = {
        CYCLE_NOT_FOUND_OR_CLOSED: { status: 400, message: "Aucun cycle ouvert trouvé — ouvrez la caisse d'abord" },
        EXPENSE_NOT_FOUND:         { status: 404, message: "Dépense introuvable" },
        CYCLE_CLOSED:              { status: 400, message: "Impossible de modifier une dépense d'un cycle fermé" },
    };

    //list des depense 
    list = async (req : Request, res : Response) => {
        try{
            const expenses = await this.service.list(req.tenant!, req.params.cycleId as string)
            return res.status(200).json({success : true, data : expenses})
        }catch(e : any){
            const err = this.errorMap[e.message]
            if(err) return res.status(err.status).json({success : false, message : err.message})
            return res.status(500).json({success : false, message : "Erreur serveur"})
        }
    }

    // create 
    create = async (req : Request, res : Response) => {
        try{
            const expense = await this.service.create(req.tenant!, req.body)
            return res.status(200).json({success : true, data : expense})
        }catch(e : any){
            const err = this.errorMap[e.message]
            if(err) return res.status(err.status).json({success : false, message : err.message})
            return res.status(500).json({success : false, message : "Erreur serveur"})
        }
    }

    // update 
    update = async (req : Request, res : Response) => {
        try{
            const expense = await this.service.update(req.tenant!, req.params.id as string, req.body)
            return res.status(200).json({success : true, data : expense})
        }catch(e : any){
            const err = this.errorMap[e.message]
            if(err) return res.status(err.status).json({success : false, message : err.message})
            return res.status(500).json({success : false, message : "Erreur serveur"})
        }
    }
    
    // delete 
    delete = async (req : Request, res : Response) => {
        try{
            const expense = await this.service.delete(req.tenant!, req.params.id as string)
            return res.status(200).json({success : true, data : expense})
        }catch(e : any){
            const err = this.errorMap[e.message]
            if(err) return res.status(err.status).json({success : false, message : err.message})
            return res.status(500).json({success : false, message : "Erreur serveur"})
        }
    }

    // get summary
    getSummary = async (req : Request, res : Response) => {
        try{
            const summary = await this.service.getSummary(req.tenant!, req.params.cycleId as string)
            return res.status(200).json({success : true, data : summary})
        }catch(e : any){
            const err = this.errorMap[e.message]
            if(err) return res.status(err.status).json({success : false, message : err.message})
            return res.status(500).json({success : false, message : "Erreur serveur"})
        }
    }
}