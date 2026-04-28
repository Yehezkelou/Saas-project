import { PrismaClient } from "@prisma/client";
import { OrderService } from "./src/services/order.service";

const prisma = new PrismaClient();
const service = new OrderService();

async function test() {
    try {
        console.log("Finding an active table...");
        const table = await prisma.table.findFirst({ where: { isActive: true } });
        if (!table) return console.log("No active table found.");
        
        console.log(`Found table: ${table.name} (Tenant: ${table.tenantId})`);

        console.log("Finding active products for tenant...");
        const products = await prisma.product.findMany({ where: { tenantId: table.tenantId, isActive: true }, take: 2 });
        if (!products.length) return console.log("No active products found.");

        const data = {
            items: products.map(p => ({ productId: p.id, quantity: 1 }))
        };

        console.log("Attempting to create order...");
        const order = await service.create(table.tenantId, table.id, data);
        console.log("Order successfully created:", order.id);

    } catch (error: any) {
        console.error("FATAL ERROR CAUGHT:");
        console.error(error.message);
        console.error(error.stack);
    } finally {
        await prisma.$disconnect();
    }
}

test();
