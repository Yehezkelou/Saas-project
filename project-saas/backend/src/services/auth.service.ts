import bcrypt from "bcryptjs";
import prisma from "../lib/prisma";
import type { loginInput, registerInput, staffInput } from "../validators/Auth.validator";
import { getDefaultCategories, getDefaultRoles, getDefaultSubscription } from "../lib/defaults";
import { Signtoken } from "../lib/jwt";
import { OAuth2Client } from "google-auth-library";

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

export class AuthService {

    // Enregistrement 
    async register(data: registerInput) {

        // verifier si l'email exites deja dans la base
        const email = await prisma.user.findUnique({
            where: {
                email: data.email
            }
        })

        if (email) {
            throw new Error("EMAIL_ALREADY_EXISTS")
        }

        // hasher le mot de passe 
        const hashedPassword = await bcrypt.hash(data.password, 12);

        // creer le tenant et L'utilsateur en une seule fois
        const result = await prisma.$transaction(async (tx) => {

            // Etape 1 creer le Tenant (l'etablissement)
            const tenant = await tx.tenant.create({
                data: {
                    name: data.tenantName,
                    businessType: data.businessType,

                }
            })

            // Etape 2 creer le user ratacher a l'etablissement
            const user = await tx.user.create({
                data: {
                    tenantId: tenant.id,
                    email: data.email,
                    phone: data.phone || null,
                    password: hashedPassword,
                    role: "ADMIN"
                }
            })

            // Etape 3 creer l'abonnement FREE
            await tx.subscription.create({
                data: {
                    tenantId: tenant.id,
                    ...getDefaultSubscription(),
                }
            })

            // Etape 4 creer les roles par defauts selon le businessType
            const defautsRoles = getDefaultRoles(data.businessType)
            if (defautsRoles && defautsRoles.length > 0) {
                await tx.role.createMany({
                    data: defautsRoles.map((role) => ({
                        tenantId: tenant.id,
                        name: role.name,
                        permissions: role.permissions
                    })),
                });
            }

            // Etape 5 creer les categorie par defaut
            const defaultCategories = getDefaultCategories(data.businessType)
            await tx.category.createMany({
                data: defaultCategories.map((cat) => ({
                    tenantId: tenant.id,
                    name: cat.name,
                    type: cat.type
                }))
            })

            return { tenant, user }
        })

        const token = Signtoken({
            userId: result.user.id,
            tenantId: result.tenant.id,
            role: "ADMIN"
        })


        return {
            token,
            user: {
                id: result.user.id,
                email: result.user.email,
                role: result.user.role
            },
            tenant: {
                id: result.tenant.id,
                name: result.tenant.name,
                businessType: result.tenant.businessType
            }
        }
    }


    // Connexion au SAss 
    async login(data: loginInput) {

        // verifier l'email 
        const user = await prisma.user.findUnique({
            where: {
                email: data.email
            },
            include: {
                tenant: true
            }
        })

        if (!user) {
            throw new Error("INVALID_CREDENTIALS")
        }

        // verifier le mot de passe
        const isPassword = await bcrypt.compare(data.password, user.password)

        if (!isPassword) {
            throw new Error("INVALID_CREDENTIALS")
        }

        // verifier si l'abonnement est toujour valide 
        const subscription = await prisma.subscription.findUnique({
            where: {
                tenantId: user.tenantId
            }
        })

        if (!subscription || subscription?.status == "SUSPENDED") {
            throw new Error("ACCOUNT_SUSPENDED")
        }


        const token = Signtoken({
            userId: user.id,
            tenantId: user.tenantId,
            role: user.role
        })


        return {
            token,
            user: {
                id: user.id,
                tenantId: user.tenantId,
                role: user.role
            },
            tenant: {
                id: user.tenant.id,
                name: user.tenant.name,
                businessType: user.tenant.businessType,
            }
        }
    }

    // Connexion Staff (via identifiant unique + PIN)
    async staffLogin(data: staffInput) {
        const staff = await prisma.staff.findUnique({
            where: { identifier: data.identifier },
            include: {
                tenant: true,
                role: true
            }
        }) as any;

        if (!staff) {
            throw new Error("INVALID_CREDENTIALS");
        }

        // Vérifier le PIN
        const isPinValid = await bcrypt.compare(data.pin, staff.pinHash);
        if (!isPinValid) {
            throw new Error("INVALID_CREDENTIALS");
        }

        // Vérifier si l'établissement est actif
        const subscription = await prisma.subscription.findUnique({
            where: { tenantId: staff.tenantId }
        });
        if (!subscription || subscription.status === "SUSPENDED") {
            throw new Error("ACCOUNT_SUSPENDED");
        }

        const token = Signtoken({
            staffId: staff.id,
            tenantId: staff.tenantId,
            role: "STAFF",
            permissions: staff.role.permissions
        });

        return {
            token,
            staff: {
                id: staff.id,
                name: staff.name,
                identifier: staff.identifier,
                role: staff.role.name,
                permissions: staff.role.permissions
            },
            tenant: {
                id: staff.tenant.id,
                name: staff.tenant.name,
                businessType: staff.tenant.businessType
            }
        };
    }

    // Authentification Google
    async googleLogin(data: { token: string; tenantName?: string; businessType?: any; phone?: string }) {
        try {
            const ticket = await googleClient.verifyIdToken({
                idToken: data.token,
                audience: process.env.GOOGLE_CLIENT_ID,
            });
            const payload = ticket.getPayload();
            if (!payload || !payload.email) throw new Error("INVALID_GOOGLE_TOKEN");

            const email = payload.email;

            // Verifier si l'utilisateur existe
            let user = await prisma.user.findUnique({
                where: { email },
                include: { tenant: true }
            });

            if (!user) {
                // Si l'utilisateur n'existe pas, il doit fournir les infos de l'établissement
                if (!data.tenantName || !data.businessType) {
                    return {
                        needsRegistration: true,
                        email,
                        name: payload.name,
                        picture: payload.picture
                    };
                }

                // Inscription via Google
                const result = await prisma.$transaction(async (tx) => {
                    const tenant = await tx.tenant.create({
                        data: {
                            name: data.tenantName!,
                            businessType: data.businessType,
                        }
                    });

                    const newUser = await tx.user.create({
                        data: {
                            tenantId: tenant.id,
                            email,
                            phone: data.phone || null,
                            password: "", // Pas de mot de passe pour Google
                            role: "ADMIN"
                        }
                    });

                    await tx.subscription.create({
                        data: {
                            tenantId: tenant.id,
                            ...getDefaultSubscription(),
                        }
                    });

                    const defautsRoles = getDefaultRoles(data.businessType);
                    if (defautsRoles && defautsRoles.length > 0) {
                        await tx.role.createMany({
                            data: defautsRoles.map((role) => ({
                                tenantId: tenant.id,
                                name: role.name,
                                permissions: role.permissions
                            })),
                        });
                    }

                    const defaultCategories = getDefaultCategories(data.businessType);
                    await tx.category.createMany({
                        data: defaultCategories.map((cat) => ({
                            tenantId: tenant.id,
                            name: cat.name,
                            type: cat.type
                        }))
                    });

                    return { tenant, user: newUser };
                });

                user = { ...result.user, tenant: result.tenant } as any;
            }

            // Verifier l'abonnement
            const subscription = await prisma.subscription.findUnique({
                where: { tenantId: user!.tenantId }
            });

            if (!subscription || subscription.status === "SUSPENDED") {
                throw new Error("ACCOUNT_SUSPENDED");
            }

            const token = Signtoken({
                userId: user!.id,
                tenantId: user!.tenantId,
                role: user!.role
            });

            return {
                token,
                user: {
                    id: user!.id,
                    tenantId: user!.tenantId,
                    role: user!.role
                },
                tenant: {
                    id: user!.tenant.id,
                    name: user!.tenant.name,
                    businessType: user!.tenant.businessType,
                }
            };
        } catch (error: any) {
            throw error;
        }
    }
}