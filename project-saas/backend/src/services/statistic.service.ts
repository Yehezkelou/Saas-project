import prisma from "../lib/prisma";
import { getPlanLimits } from "../lib/plan-limits";

export class StatisticService {
  /**
   * Calcule les statistiques pour une période donnée.
   * Vérifie la limite de jours en fonction du plan de l'établissement.
   */
  async calculateStatistics(tenantId: string, startDateStr: string, endDateStr: string) {
    const startDate = new Date(startDateStr);
    const endDate = new Date(endDateStr);

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      throw new Error("INVALID_DATES");
    }

    if (startDate > endDate) {
      throw new Error("START_DATE_AFTER_END_DATE");
    }

    // Calculer la différence de jours
    const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    // Récupérer le plan de l'établissement
    const subscription = await prisma.subscription.findUnique({
      where: { tenantId }
    });
    
    const plan = subscription?.plan ?? "FREE";
    const limits = getPlanLimits(plan);
    
    if (!limits) {
      throw new Error("INVALID_PLAN");
    }

    // Vérifier la limite de jours
    if (diffDays > limits.statistic_days) {
      throw new Error(`STATISTIC_DAYS_LIMIT_EXCEEDED:${limits.statistic_days}`);
    }

    // Récupérer les rapports générés pendant la période
    // Ou on peut calculer directement à partir des Orders, Payments et Expenses.
    // L'énoncé dit "calcule les statistiques en fonction de la date rentré", donc on calcule dynamiquement.
    
    // 1. Calculer les revenus totaux via les commandes payées sur cette période
    const orders = await prisma.order.aggregate({
      where: {
        tenantId,
        status: "PAID",
        createdAt: {
          gte: startDate,
          lte: endDate,
        }
      },
      _sum: { totalAmount: true }
    });
    
    const totalRevenue = orders._sum.totalAmount ?? 0;

    // 2. Calculer les dépenses totales sur cette période
    const expenses = await prisma.expense.aggregate({
      where: {
        tenantId,
        createdAt: {
          gte: startDate,
          lte: endDate,
        }
      },
      _sum: { amount: true }
    });

    const totalExpenses = expenses._sum.amount ?? 0;
    const netProfit = totalRevenue - totalExpenses;

    // 3. Récupérer les produits les plus vendus sur cette période
    // On prend les OrderItem liés aux Orders payés dans la période
    const orderItems = await prisma.orderItem.findMany({
      where: {
        tenantId,
        order: {
          status: "PAID",
          createdAt: {
            gte: startDate,
            lte: endDate
          }
        }
      },
      include: {
        product: true
      }
    });

    // Agréger les ventes par produit
    const productSales: Record<string, { productId: string, name: string, imageUrl: string | null, quantitySold: number, revenue: number }> = {};
    
    for (const item of orderItems) {
      if (!item.product) continue;
      if (!productSales[item.productId]) {
        productSales[item.productId] = {
          productId: item.productId,
          name: item.product.name,
          imageUrl: item.product.imageUrl,
          quantitySold: 0,
          revenue: 0
        };
      }
      productSales[item.productId]!.quantitySold += item.quantity;
      productSales[item.productId]!.revenue += (item.quantity * item.price);
    }

    // Convertir en tableau et trier par quantité vendue (décroissant)
    const topProducts = Object.values(productSales)
      .sort((a, b) => b.quantitySold - a.quantitySold)
      .slice(0, 10); // Les 10 plus vendus

    // Sauvegarder la statistique dans la base de données
    const statistic = await prisma.statistic.create({
      data: {
        tenantId,
        startDate,
        endDate,
        totalRevenue,
        netProfit,
        topProducts: topProducts as any // Cast for JSON compatibility
      }
    });

    return statistic;
  }
  
  /**
   * Liste les statistiques précédemment calculées par l'établissement.
   */
  async list(tenantId: string) {
    return prisma.statistic.findMany({
      where: { tenantId },
      orderBy: { createdAt: "desc" }
    });
  }
}
