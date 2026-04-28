import type { Request, Response } from "express";
import { AuthService } from "../services/auth.service";
import prisma from "../lib/prisma";
import logger from "../lib/logger";
import { Signtoken } from "../lib/jwt";

export class AuthController {

    RegisterController = async (req: Request, res: Response) => {
        try {
            const result = await new AuthService().register(req.body)
            return res.status(201).json({
                success: true,
                data: result
            })
        } catch (error: any) {
            if (error.message === "EMAIL_ALREADY_EXISTS") {
                return res.status(409).json({
                    success: false,
                    message: "Cet email est déja utilisé"
                })
            }
            logger.error(`Erreur d'inscription: ${error.message}`);
            return res.status(500).json({
                success: false,
                message: "Erreur serveur"
            })
        }
    }



    LoginController = async (req: Request, res: Response) => {

        try {
            const result = await new AuthService().login(req.body)
            return res.status(200).json({
                success: true,
                data: result
            })
        } catch (error: any) {
            if (error.message === "INVALID_CREDENTIALS") {
                return res.status(401).json({
                    success: false,
                    message: "Email ou mot de passe incorrect"
                })
            }

            if (error.message === "ACCOUNT_SUSPENDED") {
                return res.status(403).json({
                    success: false,
                    message: "Compte suspendu",
                })
            }
            return res.status(500).json({
                success: false,
                message: "Erreur serveur"
            })
        }
    }

    StaffLoginController = async (req: Request, res: Response) => {
        try {
            const result = await new AuthService().staffLogin(req.body);
            return res.status(200).json({
                success: true,
                data: result
            });
        } catch (error: any) {
            if (error.message === "INVALID_CREDENTIALS") {
                return res.status(401).json({
                    success: false,
                    message: "Identifiant ou code PIN incorrect"
                });
            }
            if (error.message === "ACCOUNT_SUSPENDED") {
                return res.status(403).json({
                    success: false,
                    message: "L'établissement de cet employé est suspendu"
                });
            }
            return res.status(500).json({
                success: false,
                message: "Erreur serveur"
            });
        }
    }

    superAdminLogin = async (req: Request, res: Response) => {
        try {
            const { email, password } = req.body;
            const systemEmail = process.env.SUPER_ADMIN_EMAIL;
            const systemPassword = process.env.SUPER_ADMIN_PASSWORD;

            if (email !== systemEmail || password !== systemPassword) {
                return res.status(401).json({
                    success: false,
                    message: "Identifiants système incorrects"
                });
            }

            const token = Signtoken({
                userId: "SYSTEM",
                tenantId: "SYSTEM",
                role: "SUPERADMIN"
            });

            return res.status(200).json({
                success: true,
                data: {
                    token,
                    user: { id: "SYSTEM", email: systemEmail, role: "SUPERADMIN" },
                    tenant: { id: "SYSTEM", name: "System Control", businessType: "ADMIN" }
                }
            });
        } catch (error) {
            return res.status(500).json({
                success: false,
                message: "Erreur serveur"
            });
        }
    }



    // route protegée : Retourne les infos du user ou du staff connecté
    me = async (req: Request, res: Response) => {
        try {
            if (req.user?.staffId) {
                // C'est un staff
                const staff = await prisma.staff.findUnique({
                    where: { id: req.user.staffId },
                    include: {
                        role: true,
                        tenant: true
                    }
                });

                if (!staff) {
                    return res.status(404).json({ success: false, message: "Staff non trouvé" });
                }

                return res.status(200).json({
                    success: true,
                    data: {
                        id: staff.id,
                        name: staff.name,
                        identifier: staff.identifier,
                        role: staff.role.name,
                        permissions: staff.role.permissions,
                        tenant: staff.tenant
                    }
                });
            }

            // C'est un utilisateur classique (ADMIN/MANAGER)
            const user = await prisma.user.findUnique({
                where: { id: req.user?.userId || "" },
                select: {
                    id: true, 
                    email: true, 
                    role: true, 
                    createdAt: true,
                    tenant: {
                        select: {
                            id: true, 
                            name: true, 
                            businessType: true
                        }
                    }
                }
            })

            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: "Utilisateur non trouvé"
                })
            }

            return res.status(200).json({
                success: true,
                data: user
            })
        } catch (error) {
            return res.status(500).json({
                success: false,
                message: "Erreur serveur"
            })
        }
    }

}