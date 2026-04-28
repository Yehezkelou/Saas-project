import { ProductService } from "../services/product.service"
import type { Request, Response } from "express"
import { listProductQuerySchema } from "../validators/product.validator"






export class ProductController{
    private service = new ProductService()
    private errorMap : Record<string, {status : number , message : string}> = {
        PRODUCT_NOT_FOUND : {status : 404, message : "Produit non trouvé"},
        PRODUCT_ALREADY_EXIST : {status : 400, message : "Produit existe déjà"},
        INSUFFICIENT_STOCK : {status : 400, message : "Stock insuffisant"},
        CATEGORY_NOT_FOUND : {status : 404, message : "Catégorie non trouvée"},
    }


    list = async (req: Request, res: Response) => {
        try{
            const  query = listProductQuerySchema.safeParse(req.query)
            if(!query.success) return res.status(400).json({success : false, message : "Invalid query"})
            const products = await this.service.list(req.tenant!, query.data)
            return res.status(200).json({ success: true, data: products })
        }catch(error: any){
            const err = this.errorMap[error.message]
            if(err) return res.status(err.status).json({success : false, message : err.message})
            return res.status(500).json({success : false, message : "Erreur serveur"})
        }
    }

    // create
    create = async (req: Request, res: Response) => {
        try{
            const products = await this.service.create(req.tenant!, req.body)
            return res.status(200).json({ success: true, data: products })
        }catch(error: any){
            const err = this.errorMap[error.message]
            if(err) return res.status(err.status).json({success : false, message : err.message})
            return res.status(500).json({success : false, message : "Erreur serveur"})
        }
    }

    // update
    update = async (req: Request, res: Response) => {
        try{
            const products = await this.service.update(req.tenant!, req.params.id as string, req.body)
            return res.status(200).json({ success: true, data: products })
        }catch(error: any){
            const err = this.errorMap[error.message]
            if(err) return res.status(err.status).json({success : false, message : err.message})
            return res.status(500).json({success : false, message : "Erreur serveur"})
        }
    }

    // delete
    delete = async (req: Request, res: Response) => {
        try{
            const products = await this.service.delete(req.tenant!, req.params.id as string)
            return res.status(200).json({ success: true, data: products })
        }catch(error: any){
            const err = this.errorMap[error.message]
            if(err) return res.status(err.status).json({success : false, message : err.message})
            return res.status(500).json({success : false, message : "Erreur serveur"})
        }
    }

    // adjustStock
    adjustStock = async (req: Request, res: Response) => {
        try{
            const products = await this.service.adjustStock(req.tenant!, req.params.id as string, req.body)
            return res.status(200).json({ success: true, data: products })
        }catch(error: any){
            const err = this.errorMap[error.message]
            if(err) return res.status(err.status).json({success : false, message : err.message})
            return res.status(500).json({success : false, message : "Erreur serveur"})
        }
    }

    // produit en stock faible
    lowStock = async (req: Request, res: Response) => {
        try{
            const products = await this.service.getLowStockProducts(req.tenant!)
            return res.status(200).json({ success: true, data: products })
        }catch(error: any){
            const err = this.errorMap[error.message]
            if(err) return res.status(err.status).json({success : false, message : err.message})
            return res.status(500).json({success : false, message : "Erreur serveur"})
        }
    }
}