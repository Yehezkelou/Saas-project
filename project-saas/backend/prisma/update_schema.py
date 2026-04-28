
import os

schema_path = r'c:\Project\Saas-project\project-saas\backend\prisma\schema.prisma'
content_to_append = """

// =============================================================
// 15. PRODUCT MODELS — Modèles de produits (Système)
// =============================================================
model ProductModelCategory {
  id     String         @id @default(uuid())
  name   String         @unique
  icon   String?        // Nom de l'icône React (ex: "FiCoffee")
  models ProductModel[]
}

model ProductModel {
  id          String   @id @default(uuid())
  categoryId  String
  name        String
  imageUrl    String?
  unit        String   @default("unité")
  
  category ProductModelCategory @relation(fields: [categoryId], references: [id])
}
"""

with open(schema_path, 'a', encoding='utf-8') as f:
    f.write(content_to_append)

print("Schema updated successfully")
