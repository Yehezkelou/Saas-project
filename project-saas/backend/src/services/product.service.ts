import prisma from "../lib/prisma";
import type { ajustProductInput, createProductInput, listProductQuery, updateProductInput } from "../validators/product.validator";






export class ProductService {



    async list(tenantId: string, query: listProductQuery) {
        return prisma.product.findMany({
            where: {
                tenantId,
                ...(query.categoryId && { categoryId: query.categoryId }),
                //si active non precisé, on prend tout
                ...(query.isActive !== undefined && { isActive: query.isActive }),
                // produit dont le stock est sous le seuil minimum
                ...(query.lowStock && { stock: { lte: prisma.product.fields.minStock } }),
                ...(query.search && {
                    name: {
                        contains: query.search,
                        mode: "insensitive"
                    }
                }),
            },
            orderBy: {
                createdAt: "desc"
            },
            include: {
                category: true
            }
        })
    }


    // create product
    async create(tenantId: string, data: createProductInput) {
        // verifier si la categorie appartient a ce tenant
        const category = await prisma.category.findUnique({
            where: {
                id: data.categoryId,
                tenantId,
            }
        })
        if (!category) throw new Error("CATEGORY_NOT_FOUND")

        return prisma.product.create({
            data: {
                tenantId,
                ...data
            } as any
        })
    }

    // update product
    async update(tenantId: string, productId: string, data: updateProductInput) {
        // verifier si le produit existe 
        const product = await prisma.product.findUnique({
            where: {
                id: productId,
                tenantId
            }
        })
        if (!product) throw new Error("PRODUCT_NOT_FOUND")

        // si la categorie est changé, verifier si la nouvelle appartient au tenant
        if (data.categoryId) {
            const category = await prisma.category.findUnique({
                where: {
                    id: data.categoryId,
                    tenantId
                }
            })
            if (!category) throw new Error("CATEGORY_NOT_FOUND")

        }

        // update 
        const updated = await prisma.product.update({
            where: {
                id: productId,
                tenantId,
            },
            data: {
                ...(data.name && { name: data.name }),
                ...(data.price !== undefined && { price: data.price }),
                ...(data.costPrice !== undefined && { costPrice: data.costPrice }),
                ...(data.stock !== undefined && { stock: data.stock }),
                ...(data.minStock !== undefined && { minStock: data.minStock }),
                ...(data.isActive !== undefined && { isActive: data.isActive }),
                ...(data.categoryId && { categoryId: data.categoryId }),
                ...(data.imageUrl !== undefined && { imageUrl: data.imageUrl }),
                ...(data.colorCode !== undefined && { colorCode: data.colorCode }),
            }
        })


        // cree une notification si le stock est bas du seuil
        if(updated.stock <= updated.minStock){
            await prisma.notification.create({
                data : {
                    tenantId, 
                    title : "stock faible",
                    message : `${updated.name} : ${updated.stock} unité(s) restante(s) (seuil : ${updated.minStock})`,
                    category: "WARNING"
                }
            })
        }

        return updated;

    }

    //Ajuster manuellement le stock 
    // quantite positive = ajout
    // quantite negative = retrait
    async adjustStock(tenantId: string, productId: string, data: ajustProductInput) {
        // verifier si le produit existe
        const product = await prisma.product.findUnique({
            where: { id: productId, tenantId }
        })
        if (!product) throw new Error("PRODUCT_NOT_FOUND")

        // ajuster ne nouveau stock
        const newStock = product.stock + data.quantity
        if (newStock < 0) throw new Error("INSUFFICIENT_STOCK")

        // update le stack
        const updated = await prisma.product.update({
            where: {
                id : productId,
                tenantId,
            },
            data: {
                stock : newStock
            }
        })

        // cree une notification si le stock est bas du seuil
        if(updated.stock <= updated.minStock){
            await prisma.notification.create({
                data : {
                    tenantId, 
                    title : "stock faible",
                    message : `${updated.name} : ${updated.stock} unité(s) restante(s) (seuil : ${updated.minStock})`,
                    category: "WARNING"
                }
            })
        }

    }

    // delete product 
    async delete(tenantId: string, productId: string) {
        const product = await prisma.product.findUnique({
            where: { id: productId, tenantId }
        })
        if (!product) throw new Error("PRODUCT_NOT_FOUND")

        await prisma.product.delete({
            where: {
                id: productId,
                tenantId,
            }
        })
    }

    // recuperer les produit en stock faible
    async getLowStockProducts(tenantId: string) {
        return prisma.product.findMany({
            where: {
                tenantId,
                stock: { lte: prisma.product.fields.minStock }
            },
            include: {
                category: true
            }
        })
    }

}