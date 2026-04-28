import { getPlanLimits, PLAN_LIMITS } from "../lib/plan-limits";
import prisma from "../lib/prisma";
import type { changePlanInput, renewSubcriptionInput } from "../validators/subscription.validator";

export class SubscriptionService {

    // recuperer la subscription actule 
    // ce que l'on affiche dans le frontend
    async getWithUsage(tenantId : string){
        const subscription = await prisma.subscription.findUnique({
            where : {tenantId},
        })
        if(!subscription) throw new Error("SUBSCRIPTION_NOT_FOUND")
        
        const plan = subscription.plan
        const limits = getPlanLimits(plan)

        // compter l'utilisation actuelle en parallele
        const now = new Date();
        const startofMonth = new Date(now.getFullYear(), now.getMonth(), 1)

        const [
            staffCount,
            productCount,
            tableCount,
            ordersThisMonth,
            category_count,
        ] = await Promise.all([
            prisma.staff.count({where : {tenantId}}),
            prisma.product.count({where : {tenantId, isActive : true}}),
            prisma.table.count({where : {tenantId, isActive : true}}),
            prisma.order.count({where : {tenantId, createdAt : {gte : startofMonth}}}),
            prisma.category.count({where : {tenantId}}),
        ])

        // calculer la date d'expiration
        const dayLeft = Math.ceil(
            (subscription.expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
        )

        return {
            subscription,
            dayLeft : Math.max(0, dayLeft),
            isExpiringSoon : dayLeft <= 7 && dayLeft > 0,
            usage : {
                staff : {current : staffCount , limits : limits?.staff_count},
                product : {current : productCount , limits : limits?.product_count},
                table : {current : tableCount , limits : limits?.table_count},
                orders : {current : ordersThisMonth , limits : limits?.orders_per_month},
                category : {current : category_count , limits : limits?.categories_count},
                reportDay : {current : 0, limits : limits?.report_days},
                notification : {current : 0, limits : limits?.notifications}
            },
            
            // afficher tout les plan avec leurs limites (pour afficher l'upgrade)
            availablePlans : Object.entries(PLAN_LIMITS).map(([name , planLimits]) => ({
                name,
                limits : planLimits,
                isCurrent : plan === name,
            }))
        }
    }

    // ── Changer de plan ───────────────────────────────────────
    async changePlan(tenantId: string, data : changePlanInput) {
        const subscription = await prisma.subscription.findUnique({
                where: { tenantId },
        });
        if (!subscription) throw new Error("SUBSCRIPTION_NOT_FOUND");
        if (subscription.plan === data.plan) throw new Error("ALREADY_ON_THIS_PLAN");
    
        const newLimits = getPlanLimits(data.plan);
        const [staffCount, productCount, tableCount] = await Promise.all([
            prisma.staff.count({ where: { tenantId } }),
            prisma.product.count({ where: { tenantId, isActive: true } }),
            prisma.table.count({ where: { tenantId, isActive: true } }),
        ]);
    
        if (newLimits?.staff_count !== -1 && staffCount > newLimits!.staff_count) {
            throw new Error(`DOWNGRADE_BLOCKED:staff:${staffCount}:${newLimits?.staff_count}`);
        }
        if (newLimits?.product_count !== -1 && productCount > newLimits!.product_count) {
            throw new Error(`DOWNGRADE_BLOCKED:products:${productCount}:${newLimits?.product_count}`);
        }
        if (newLimits?.table_count !== -1 && tableCount > newLimits!.table_count) {
            throw new Error(`DOWNGRADE_BLOCKED:tables:${tableCount}:${newLimits?.table_count}`);
        }
    
        const updated = await prisma.subscription.update({
            where: { tenantId },
            data:  { pendingPlan: data.plan as any },
        });
    
        return updated;
    }

    // ── Renouveler un abonnement ──────────────────────────────
    async renew(tenantId: string, data : renewSubcriptionInput) {
        const subscription = await prisma.subscription.findUnique({
            where: { tenantId },
        });
        if (!subscription) throw new Error("SUBSCRIPTION_NOT_FOUND");

        const now = new Date();
        const currentExpiresAt = subscription.expiresAt > now ? subscription.expiresAt : now;
        const newExpiresAt = new Date(currentExpiresAt);
        newExpiresAt.setMonth(newExpiresAt.getMonth() + data.months);

        const updated = await prisma.subscription.update({
            where: { tenantId },
            data:  { expiresAt: newExpiresAt },
        });

        return updated;
    }
    
    // ── Suspendre un tenant ───────────────────────────────────
    async suspend(tenantId: string) {
        await prisma.subscription.update({
            where: { tenantId },
            data:  { status: "SUSPENDED" },
        });
    
        await prisma.notification.create({
            data: {
                tenantId,
                title:   "Abonnement suspendu",
                message: "Votre abonnement a été suspendu. Renouvelez-le pour retrouver l'accès.",
            },
        });
    }
    
    // ── Expirer un tenant ─────────────────────────────────────
    async expire(tenantId: string) {
        await prisma.subscription.update({
            where: { tenantId },
            data:  { status: "EXPIRED" },
        });
    }

    /**
     * Liste tous les établissements avec leurs abonnements
     */
    async listAllWithTenants() {
        return prisma.tenant.findMany({
            include: {
                users: {
                    select: { email: true }
                },
                subscription: true
            },
            orderBy: { createdAt: "desc" }
        });
    }

    /**
     * Valide un abonnement ou un changement de plan
     */
    async verifySubscription(tenantId: string) {
        const sub = await prisma.subscription.findUnique({ where: { tenantId } });
        const updateData: any = { status: "ACTIVE" };

        if (sub?.pendingPlan) {
            updateData.plan = sub.pendingPlan;
            updateData.pendingPlan = null;
        }

        const updated = await prisma.subscription.update({
            where: { tenantId },
            data: updateData
        });

        await prisma.notification.create({
            data: {
                tenantId,
                title:   sub?.pendingPlan ? "Plan validé !" : "Compte activé !",
                message: sub?.pendingPlan 
                    ? `Votre passage au plan ${sub.pendingPlan} a été approuvé.` 
                    : "L'administrateur a validé votre accès.",
            },
        });

        return updated;
    }

    /**
     * Rejeter une demande de changement de plan
     */
    async rejectPlanChange(tenantId: string) {
        const updated = await prisma.subscription.update({
            where: { tenantId },
            data: { pendingPlan: null }
        });

        await prisma.notification.create({
            data: {
                tenantId,
                title:   "Demande refusée",
                message: "Votre demande de changement de forfait a été refusée par l'administrateur.",
            },
        });

        return updated;
    }

    /**
     * Supprime définitivement un établissement
     */
    async deleteTenant(tenantId: string) {
        return prisma.tenant.delete({
            where: { id: tenantId }
        });
    }

    /**
     * Réactive un abonnement
     */
    async activate(tenantId: string) {
        return prisma.subscription.update({
            where: { tenantId },
            data: { status: "ACTIVE" }
        });
    }

    /**
     * Changement de plan forcé par l'administrateur
     */
    async adminChangePlan(tenantId: string, newPlan: string) {
        const updated = await prisma.subscription.update({
            where: { tenantId },
            data: { 
                plan: newPlan as any,
                pendingPlan: null // On nettoie toute demande en attente
            }
        });

        await prisma.notification.create({
            data: {
                tenantId,
                title:   "Plan mis à jour", 
                message: `L'administrateur a modifié votre abonnement vers le plan ${newPlan}.`,
            },
        });

        return updated;
    }

    /**
     * Statistiques globales
     */
    async getGlobalStats() {
        try {
            const [totalTenants, pendingTenants, activeTenants, totalOrders] = await Promise.all([
                prisma.tenant.count().catch(() => 0),
                prisma.subscription.count({ where: { status: "PENDING" as any } }).catch(() => 0),
                prisma.subscription.count({ where: { status: "ACTIVE" as any } }).catch(() => 0),
                prisma.order.count().catch(() => 0)
            ]);

            return { totalTenants, pendingTenants, activeTenants, totalOrders };
        } catch (error) {
            console.error("Error fetching stats:", error);
            return { totalTenants: 0, pendingTenants: 0, activeTenants: 0, totalOrders: 0 };
        }
    }
}