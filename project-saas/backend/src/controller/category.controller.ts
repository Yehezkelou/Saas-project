import { CategoryService } from "../services/category.service";
import type { Request, Response } from "express";





export class CategoryController{
        
    private categoryservice = new CategoryService()
    private static errorMap: Record<string, {status : number, message : string}> = {
        "CATEGORY_ALREADY_EXIST" : {status : 400, message : "La categorie existe deja"},
        "CATEGORY_NOT_FOUND" : {status : 404, message : "La categorie n'a pas été trouvé"},
        "CATEGORY_HAS_PRODUCTS" : {status : 400, message : "La categorie a des produits"},
    }


    // list
    list = async (req : Request, res : Response) => {
        try{
            const categories = await this.categoryservice.list(req.tenant!)
            return res.status(200).json({success : true, data : categories, message : "Categories récupérées avec succés"})
        }catch(e : any){
            const err = CategoryController.errorMap[e.message]
            if(err) return res.status(err.status).json({success : false, message : err.message})
            return res.status(500).json({success : false, message : "Erreur serveur"})
        }
    }

    // create
    create = async (req : Request, res : Response) => {
        try{
            const category = await this.categoryservice.create(req.tenant!, req.body)
            return res.status(200).json({success : true, data : category, message : "Categorie créée avec succés"})
        }catch(e : any){
            const err = CategoryController.errorMap[e.message]
            if(err) return res.status(err.status).json({success : false, message : err.message})
            return res.status(500).json({success : false, message : "Erreur serveur"})
        }
    }

    // update
    update = async (req : Request, res : Response) => {
        try{
            const category = await this.categoryservice.update(req.tenant!, req.params.id as string, req.body)
            return res.status(200).json({success : true, data : category, message : "Categorie mise a jour avec succés"})
        }catch(e : any){
            const err = CategoryController.errorMap[e.message]
            if(err) return res.status(err.status).json({success : false, message : err.message})
            return res.status(500).json({success : false, message : "Erreur serveur"})
        }
    }

    // delete
    delete = async (req : Request, res : Response) => {
        try{
            const category = await this.categoryservice.delete(req.tenant!, req.params.id as string)
            return res.status(200).json({success : true, data : category, message : "Categorie supprimée avec succés"})
        }catch(e : any){
            const err = CategoryController.errorMap[e.message]
            if(err) return res.status(err.status).json({success : false, message : err.message})
            return res.status(500).json({success : false, message : "Erreur serveur"})
        }
    }
}