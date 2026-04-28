import prisma from "../lib/prisma";
import type { createCategorieInput, updateCategorieInput } from "../validators/categorie.validator";








export class CategoryService{
    
    // liste des cotegories
    async list(tenantId : string){
        return await prisma.category.findMany({
            where : {tenantId},
            orderBy : {name : "asc"},
            include : {
                _count: {
                    select : {products : true}
                }
            }
        })
    }


    // create category
    async create(tenantId : string, data : createCategorieInput){
        // verifier si la cotegorie exite
        const existing = await prisma.category.findFirst({
           where : {tenantId, name : data.name} 
        })
        if(existing) throw new Error("CATEGORY_ALREADY_EXIST")

        // create
        return await prisma.category.create({
            data : {tenantId, ...data},
            select : {
                id : true,
                name : true,
                _count : {
                    select : {products : true}
                }
            
            }
        })
    }

    // update categorie
    async update(tenantId : string , categoryId : string, data : updateCategorieInput){
        // verifier si la categorie existe 
        const existing = await prisma.category.findFirst({
            where : {tenantId, id: categoryId}
        })
        if(!existing) throw new Error("CATEGORY_NOT_FOUND")

        // update
        return await prisma.category.update({
            where : {tenantId, id : categoryId},
            data: {
                tenantId,
                name : data.name!,
                type : data.type!
            },
            select : {
                id : true,
                name : true,
                type : true,
                _count : {
                    select : {products : true}
                }
            }
        })
    }


    //delete 
    async delete(tenantId : string, categoryId : string){
        const existing = await prisma.category.findFirst({
            where : {tenantId, id: categoryId},
            include : {
                _count : {
                    select : {products : true}
                }
            }
        })
        if(!existing) throw new Error("CATEGORY_NOT_FOUND")

        if(existing._count.products > 0) throw new Error("CATEGORY_HAS_PRODUCTS")

        // delete
        return await prisma.category.delete({
            where : {tenantId, id : categoryId},
            select : {
                id : true,
                name : true,
                type : true,
                _count : {
                    select : {products : true}
                }
            }
        })
    }
}