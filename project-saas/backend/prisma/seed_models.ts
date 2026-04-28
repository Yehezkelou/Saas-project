
import "dotenv/config";
import prisma from "../src/lib/prisma";

async function main() {
  console.log("Cleaning old product models...");
  await prisma.productModel.deleteMany({});
  await prisma.productModelCategory.deleteMany({});

  console.log("Seeding Product Model Categories with images...");

  const categories = [
    { name: "Boissons",  icon: "FiCoffee",      imageUrl: "/uploads/models/cat_boissons.png" },
    { name: "Plats",     icon: "FiPizza",        imageUrl: "/uploads/models/cat_plats.png" },
    { name: "Desserts",  icon: "FiLayers",       imageUrl: "/uploads/models/cat_desserts.png" },
    { name: "Snacks",    icon: "FiShoppingBag",  imageUrl: "/uploads/models/cat_snacks.png" },
    { name: "Entrées",   icon: "FiStar",         imageUrl: "/uploads/models/cat_entrees.png" },
  ];

  for (const cat of categories) {
    const created = await prisma.productModelCategory.create({
      data: { name: cat.name, icon: cat.icon, imageUrl: cat.imageUrl },
    });

    if (cat.name === "Boissons") {
      await prisma.productModel.createMany({
        data: [
          { name: "Espresso",           unit: "tasse",     imageUrl: "/uploads/models/model_espresso.png",  categoryId: created.id },
          { name: "Coca-Cola 33cl",     unit: "canette",   imageUrl: "/uploads/models/model_cocacola.png",  categoryId: created.id },
          { name: "Eau Minérale 50cl",  unit: "bouteille", imageUrl: "/uploads/models/model_eau.png",       categoryId: created.id },
          { name: "Bière Heineken",     unit: "bouteille", imageUrl: "/uploads/models/model_biere.png",     categoryId: created.id },
        ],
      });
    }

    if (cat.name === "Plats") {
      await prisma.productModel.createMany({
        data: [
          { name: "Pizza Margherita", unit: "plat", imageUrl: "/uploads/models/model_pizza.png",  categoryId: created.id },
          { name: "Burger Classic",   unit: "plat", imageUrl: "/uploads/models/model_burger.png", categoryId: created.id },
          { name: "Steak Frites",     unit: "plat", imageUrl: "/uploads/models/model_steak.png",  categoryId: created.id },
        ],
      });
    }
  }

  console.log("Seeding finished!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
