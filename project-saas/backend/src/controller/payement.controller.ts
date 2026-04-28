import { PayementService } from "../services/payement.service";
import type { Request, Response } from "express";



export class PayementController {

    private services = new PayementService();
    private errorMap: Record<string, { status: number; message: string }> = {
        ORDER_NOT_FOUND:       { status: 404, message: "Commande introuvable" },
        ORDER_ALREADY_PAID:    { status: 400, message: "Cette commande est déjà réglée" },
        ORDER_NOT_READY:       { status: 400, message: "La commande n'est pas encore prête à être encaissée" },
        AMOUNT_EXCEEDS_TOTAL:  { status: 400, message: "Le montant dépasse le total de la commande" },
        SPLIT_AMOUNT_MISMATCH: { status: 400, message: "La somme des paiements ne correspond pas au total de la commande" },
    };


    // list 
    list = async (req : Request, res : Response) => {
        try{
            const payements = await this.services.list(req.tenant!, req.params.cycleId as string)
            return res.status(200).json({success : true, data : payements})
        }catch(e : any){
            const err = this.errorMap[e.message]
            if(err) return res.status(err.status).json({success : false, message : err.message})
            return res.status(500).json({success : false, message : "Erreur serveur"})
        }
    }

    // pay 
    pay = async (req : Request, res : Response) => {
        try{
            const payement = await this.services.pay(req.tenant!, req.body)
            return res.status(200).json({success : true, data : payement})
        }catch(e : any){
            const err = this.errorMap[e.message]
            if(err) return res.status(err.status).json({success : false, message : err.message})
            return res.status(500).json({success : false, message : "Erreur serveur"})
        }
    }

    // split pay 
    splitPay = async (req : Request, res : Response) => {
        try{
            const payement = await this.services.splitPay(req.tenant!, req.params.orderId as string, req.body)
            return res.status(200).json({success : true, data : payement})
        }catch(e : any){
            const err = this.errorMap[e.message]
            if(err) return res.status(err.status).json({success : false, message : err.message})
            return res.status(500).json({success : false, message : "Erreur serveur"})
        }
    }

    // summary by cycle 
    summaryByCycle = async (req : Request, res : Response) => {
        try{
            const summary = await this.services.getSummaryByCycle(req.tenant!, req.params.cycleId as string)
            return res.status(200).json({success : true, data : summary})
        }catch(e : any){
            const err = this.errorMap[e.message]
            if(err) return res.status(err.status).json({success : false, message : err.message})
            return res.status(500).json({success : false, message : "Erreur serveur"})
        }
    }
           
}