import prisma from "../lib/prisma";
import type { changePinStaffPinInput, createStaffInput, updateStaffInput } from "../validators/staff.validator";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";



interface StaffTokenPayload {
    staffId : string;
    tenantId : string;
    roleId : string;
    name : string;
    type : "STAFF_SESSION"
}





export class StaffService{

    // liste des staff
    async list(tenantId : string){
        return await prisma.staff.findMany({
            where : {tenantId},
            orderBy : {name : "asc"},
            select : {
                id : true,
                name : true,
                identifier : true,
                role : {
                    select : {
                        id : true,
                        name : true,
                        permissions : true                    
                    }
                }
            }

        })
    }

    // creation des staff
    async create(data : createStaffInput, tenantId : string){

        // verifier si le staff existe deja (par nom ou identifier dans ce tenant)
        const existing = await prisma.staff.findFirst({
            where : { 
                OR: [
                    { name: data.name, tenantId },
                    { identifier: data.identifier }
                ]
            }
        })

        if(existing){
            if(existing.name === data.name && existing.tenantId === tenantId) throw new Error("STAFF_NAME_ALREADY_EXISTS")
            if(existing.identifier === data.identifier) throw new Error("STAFF_ID_ALREADY_EXISTS")
        }

        // hash du pin 
        const pinHash = await bcrypt.hash(data.pin, 10)

        return await prisma.staff.create({
            data:{
                name : data.name,
                identifier : data.identifier,
                tenantId : tenantId,
                roleId : data.roleId,
                pinHash,
            }, 
            select : {
                id : true,
                name : true,
                createdAt : true,
                role : {
                    select : {
                        id : true,
                        name : true,
                    }
                }
            }
        })

    }

    // update staff
    async update(tenantId : string, staffId : string, data: updateStaffInput){
        
        // verifier si il existe
        const existing = await prisma.staff.findFirst({
            where : {tenantId, id : staffId}
        })

        if(!existing){
            throw new Error("STAFF_NOT_FOUND")
        }

        // si on change de role on doit verifier si le nouveau role exite

        if(data.roleId){
            const roleExists = await prisma.role.findFirst({
                where : {tenantId, id : data.roleId}
            })
            if(!roleExists) throw new Error("ROLE_NOT_FOUND")
        }

        // Construction des données à mettre à jour
        const updateData: any = {
            name: data.name,
            identifier: data.identifier,
            roleId: data.roleId
        };

        // Verifier l'unicité globale de l'identifiant si changé
        if (data.identifier && data.identifier !== existing.identifier) {
            const idConflict = await prisma.staff.findUnique({
                where: { identifier: data.identifier }
            });
            if (idConflict) throw new Error("STAFF_ID_ALREADY_EXISTS");
        }

        if (data.pin) {
            updateData.pinHash = await bcrypt.hash(data.pin, 10);
        }

        // update 
        return await prisma.staff.update({
            where : {tenantId, id : staffId},
            data : updateData,
            select : {
                id : true,
                name : true,
                createdAt : true,
                role : {
                    select : {
                        id : true,
                        name : true,
                    }
                }
            }

        })
            
    }

    // changePin
    async changePin(tenantId: string, staffId : string, data : changePinStaffPinInput){
        // verifier si le staff exite
        const existing = await prisma.staff.findFirst({
            where : {tenantId, id : staffId}
        })
        if(!existing) throw new Error("STAFF_NOT_FOUND")

        // verifier si le code est valide
        const isValid = bcrypt.compare(data.currentPin, existing.pinHash)
        if(!isValid) throw new Error("INVALID_PIN")

        // hash new pin
        const newPinHash = await bcrypt.hash(data.newPin, 10)
        // update
        return await prisma.staff.update({
            where : {tenantId, id : staffId},
            data : {
                pinHash : newPinHash
            }, 
            select : {
                id : true,
                name : true,
                createdAt : true,
                role : {
                    select : {
                        id : true,
                        name : true,
                    }
                }
            }
        })
    }

    // delete staff
    async delete(tenantId : string, staffId : string){
        // verifier si le staff exite
        const existing = await prisma.staff.findFirst({
            where : {tenantId, id : staffId}
        })
        if(!existing) throw new Error("STAFF_NOT_FOUND")

        // delete
        return await prisma.staff.delete({
            where : {tenantId, id : staffId},
            select : {
                id : true,
                name : true,
                createdAt : true,
                role : {
                    select : {
                        id : true,
                        name : true,
                    }
                }
            }
        })
    }


    // Login Pin avec l'identifiant personnalisé
    async loginByIdentifier(tenantId: string, identifier: string, pin: string) {
        // verifier si le staff existe par son identifiant unique pour ce tenant
        const existing = await prisma.staff.findFirst({
            where: { tenantId, identifier },
            include: { role: true }
        })
        if (!existing) throw new Error("STAFF_NOT_FOUND")

        // verifier si le pin est correcte
        const isValid = await bcrypt.compare(pin, existing.pinHash)
        if (!isValid) throw new Error("INVALID_PIN")

        // generer un token
        const staffSessionToken = await jwt.sign(
            {
                staffId: existing.id,
                tenantId: existing.tenantId,
                roleId: existing.roleId,
                name: existing.name,
                type: "STAFF_SESSION",
            } as StaffTokenPayload,
            process.env.JWT_SECRET!,
            { expiresIn: "10h" }
        )

        return {
            token: staffSessionToken,
            staff: {
                staffId: existing.id,
                name: existing.name,
                identifier: existing.identifier,
                role: existing.role.name,
                permission: existing.role.permissions,
                tenantId: existing.tenantId,
            }
        }
    }

}
    