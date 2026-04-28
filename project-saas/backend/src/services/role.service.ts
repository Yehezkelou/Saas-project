import prisma from "../lib/prisma";
import type { CreateRoleInput, updateRoleInput } from "../validators/role.validator";





export class RoleService {


    async creatRole(data : CreateRoleInput, tenantId : string){

        // verifie si le role existe deja pour le tenant 
        // deux tenant peuvent avoir le meme nom de role
        // mais un tenant ne peut pas avoir deux roles avec le meme nom
        const existrole = await prisma.role.findFirst({
            where: {tenantId , name : data.name.toUpperCase()}
        })

        if(existrole){
            throw new Error("ROLE_ALREADY_EXIST")
        }

        // creation du role 
        const role = await prisma.role.create({
            data : {
                tenantId : tenantId,
                name : data.name.toUpperCase(),
                permissions : [...data.permissions]
            }
        })

        return {
            role
        }

    }

    // mise a jour d'un role
    async updateRole(tenantId : string, roleId: string, data : updateRoleInput){

        const existing = await prisma.role.findFirst({
            where : {tenantId, name : data.name!.toUpperCase()}
        })

        if(existing) {
            throw new Error("ROLE_ALREADY_EXIST")
        }

        // mise a jour du role 
        const role = await prisma.role.update({
            where: {
                tenantId,
                id : roleId
            },
            data : {
                name : data.name!.toUpperCase(),
                permissions : [...data.permissions!]
            }

        })

        return {
            role
        }
    }


    // liste tout les role disponible de l'etablissement
    async getAllRoles(tenantId: string){

        const role = await prisma.role.findMany({
            where : {tenantId},
            orderBy : {name : "asc"},
            include : {
                _count : {select : {staff : true}}
            }
        })

        return role
    }

    // supression du role 
    async deleteRole(tenantId : string, roleId : string){
        const existing = await prisma.role.findFirst({
            where : {tenantId, id : roleId},
            include : {_count : {select : {staff : true} }}
            
        })

        if(!existing){
            throw new Error("ROLE_NOT_FOUND")
        }

        if(existing._count.staff > 0){
            throw new Error("ROLE_HAS_STAFF")
        }

        return await prisma.role.delete({
            where: {id: roleId, tenantId: tenantId},
        })
    }
}