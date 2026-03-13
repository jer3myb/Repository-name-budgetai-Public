
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  // Create demo user
  const password = await bcrypt.hash("demo1234", 12);
  const user = await prisma.user.upsert({
    where: { email: "demo@budgetai.app" },
    update: {},
    create: { email: "demo@budgetai.app", password, name: "Marie Demo" },
  });

  console.log(`✅ User: ${user.email}`);

  // Create demo transactions
  const now = new Date();
  const transactions = [];
  
  const merchants = [
    { merchant: "Netflix", amount: -13.49, category: "SUBSCRIPTION" },
    { merchant: "Spotify", amount: -10.99, category: "SUBSCRIPTION" },
    { merchant: "Amazon Prime", amount: -6.99, category: "SUBSCRIPTION" },
    { merchant: "Disney+", amount: -8.99, category: "SUBSCRIPTION" },
    { merchant: "Carrefour", amount: -87.45, category: "GROCERIES" },
    { merchant: "Monoprix", amount: -43.20, category: "GROCERIES" },
    { merchant: "EDF", amount: -85.00, category: "UTILITIES" },
    { merchant: "Orange Mobile", amount: -29.99, category: "UTILITIES" },
    { merchant: "SNCF", amount: -45.00, category: "TRANSPORT" },
    { merchant: "Uber", amount: -12.50, category: "TRANSPORT" },
    { merchant: "Restaurant Le Bistrot", amount: -38.00, category: "RESTAURANT" },
    { merchant: "McDonald's", amount: -11.80, category: "RESTAURANT" },
    { merchant: "Amazon", amount: -34.99, category: "SHOPPING" },
    { merchant: "Zara", amount: -59.95, category: "SHOPPING" },
    { merchant: "Salaire", amount: 2800.00, category: "INCOME" },
    { merchant: "Loyer", amount: -750.00, category: "RENT" },
    { merchant: "Microsoft 365", amount: -10.00, category: "SUBSCRIPTION" },
    { merchant: "Adobe Creative Cloud", amount: -54.99, category: "SUBSCRIPTION" },
    { merchant: "Canal+", amount: -22.99, category: "SUBSCRIPTION" },
    { merchant: "Deezer", amount: -10.99, category: "SUBSCRIPTION" },
  ];

  // Create 3 months of transactions
  for (let month = 2; month >= 0; month--) {
    for (const tx of merchants) {
      const date = new Date(now.getFullYear(), now.getMonth() - month, Math.floor(Math.random() * 28) + 1);
      transactions.push({
        userId: user.id,
        date,
        merchant: tx.merchant,
        description: tx.merchant,
        amount: tx.amount,
        currency: "EUR",
        category: tx.category as any,
      });
    }
  }

  await prisma.transaction.createMany({ data: transactions });
  console.log(`✅ Created ${transactions.length} transactions`);
  console.log("\n🎉 Seed complete! Demo credentials:");
  console.log("   Email: demo@budgetai.app");
  console.log("   Password: demo1234");
}

main().catch(console.error).finally(() => prisma.$disconnect());
