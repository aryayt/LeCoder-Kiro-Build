import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function checkUser() {
  console.log("🔍 Checking user in database...");

  try {
    const email = "aryatest1@gmail.com";

    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        accounts: true,
        sessions: true,
      },
    });

    if (user) {
      console.log("✅ User found:");
      console.log("ID:", user.id);
      console.log("Email:", user.email);
      console.log("Name:", user.name);
      console.log("Password field:", user.password ? "Has password hash" : "No password");
      console.log("Email verified:", user.emailVerified);
      console.log("Created at:", user.createdAt);
      console.log("Accounts:", user.accounts.length);
      console.log("Sessions:", user.sessions.length);
      
      if (user.accounts.length > 0) {
        console.log("Account details:");
        user.accounts.forEach((account, i) => {
          console.log(`  Account ${i + 1}:`);
          console.log(`    Provider: ${account.providerId}`);
          console.log(`    Account ID: ${account.accountId}`);
        });
      }
    } else {
      console.log("❌ User not found");
    }

  } catch (error) {
    console.error("❌ Error:", error);
  } finally {
    await prisma.$disconnect();
  }
}

checkUser();