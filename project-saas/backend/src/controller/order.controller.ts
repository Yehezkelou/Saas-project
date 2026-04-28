import { OrderService } from "../services/order.service";
import type { Request, Response } from "express";
import { listOrderQuerySchema } from "../validators/order.validator";




export class OrderController {
    private  service = new OrderService()
    private errorMap: Record<string, { status: number; message: string }> = {
            NO_ACTIVE_CYCLE:           { status: 400, message: "Aucune caisse ouverte — ouvrez la caisse d'abord" },
            TABLE_NOT_FOUND:           { status: 404, message: "Table introuvable" },
            PRODUCT_NOT_FOUND:         { status: 404, message: "Un ou plusieurs produits sont introuvables" },
            ORDER_NOT_FOUND:           { status: 404, message: "Commande introuvable" },
            ORDER_ALREADY_PAID:        { status: 400, message: "Cette commande est déjà payée" },
            INVALID_STATUS_TRANSITION: { status: 400, message: "Transition de statut invalide" },
            ITEM_NOT_FOUND:            { status: 404, message: "Article introuvable dans cette commande" },
};

        // liste
        list = async (req : Request, res : Response) => {
            try{
                const query = listOrderQuerySchema.safeParse(req.query)
                if(!query.success){
                    return res.status(400).json({success : false, message : "Requête invalide", errors : query.error.issues})
                }
                
                // Sécurité : Si le client scan la table, on force l'ID de sa table pour ne pas qu'il voit les autres
                if (req.tableSession?.tableId) {
                    query.data.tableId = req.tableSession.tableId;
                }

                const orders = await this.service.list(req.tenant!, query.data)
                return res.status(200).json({success : true, data : orders, message : "Commandes récupérées avec succés"})
            }catch(e : any){
                const err = this.errorMap[e.message]
                if(err) return res.status(err.status).json({success : false, message : err.message})
                return res.status(500).json({success : false, message : "Erreur serveur"})
            }
        }

        // create 
        create = async (req : Request, res : Response) => {
            try{
                // Si la requête vient du POS Staff, tableId peut être absent
                // Si elle vient du scan Client, tableId est obligatoire
                const tableId = req.body.tableId || req.tableSession?.tableId || null;
                
                if(!tableId && req.tableSession) throw new Error("TABLE_NOT_FOUND");

                const isStaff = !req.tableSession;
                const order = await this.service.create(req.tenant!, tableId, req.body, isStaff)
                return res.status(200).json({success : true, data : order, message : "Commande créée avec succés"})
            }catch(e : any){
                console.error("DEBUG ORDER CREATE ERROR: ", e);
                const err = this.errorMap[e.message]
                if(err) return res.status(err.status).json({success : false, message : err.message})
                return res.status(500).json({success : false, message : "Erreur serveur"})
            }
        }

        // get by id 
        getById = async (req : Request, res : Response) => {
            try{
                const order = await this.service.getById(req.tenant!, req.params.id as string)
                return res.status(200).json({success : true, data : order, message : "Commande récupérée avec succés"})
            }catch(e : any){
                const err = this.errorMap[e.message]
                if(err) return res.status(err.status).json({success : false, message : err.message})
                return res.status(500).json({success : false, message : "Erreur serveur"})
            }
        }

        // ajouter item 
        addOrderItem = async (req : Request, res : Response) => {
            try{
                const order = await this.service.addItem(req.tenant!, req.params.id as string, req.body)
                return res.status(200).json({success : true, data : order, message : "Item ajouté avec succés"})
            }catch(e : any){
                const err = this.errorMap[e.message]
                if(err) return res.status(err.status).json({success : false, message : err.message})
                return res.status(500).json({success : false, message : "Erreur serveur"})
            }
        }

        // suprimer Item
        removeOrderItem = async (req : Request, res : Response) => {
            try{
                const order = await this.service.removeItem(req.tenant!, req.params.id as string, req.params.itemId as string)
                return res.status(200).json({success : true, data : order, message : "Item supprimé avec succés"})
            }catch(e : any){
                const err = this.errorMap[e.message]
                if(err) return res.status(err.status).json({success : false, message : err.message})
                return res.status(500).json({success : false, message : "Erreur serveur"})
            }
        }

        // updateStatus 
        updateStatus = async (req : Request, res : Response) => {
            try{
                const order = await this.service.updateStatus(req.tenant!, req.params.id as string, req.body)
                return res.status(200).json({success : true, data : order, message : "Statut de la commande mis à jour avec succés"})
            }catch(e : any){
                const err = this.errorMap[e.message]
                if(err) return res.status(err.status).json({success : false, message : err.message})
                return res.status(500).json({success : false, message : "Erreur serveur"})
            }
        }

        // annuler une commande (Full)
        cancel = async (req : Request, res : Response) => {
            try {
                const order = await this.service.cancel(req.tenant!, req.params.id as string);
                return res.status(200).json({ success: true, data: order, message: "Commande annulée avec succès" });
            } catch (e: any) {
                const err = this.errorMap[e.message];
                if (err) return res.status(err.status).json({ success: false, message: err.message });
                return res.status(500).json({ success: false, message: "Erreur serveur lors de l'annulation" });
            }
        }
}