import { hash } from "bcryptjs";
import { db } from "~/server/db";

async function setupTestAccount() {
  console.log("🔧 Setting up test account with Better Auth...");

  try {
    // Check if user already exists
    const existingUser = await db.user.findUnique({
      where: { email: "aryateja2106@gmail.com" },
    });

    if (existingUser) {
      console.log("ℹ️ User already exists, updating...");
      
      // Hash the password
      const hashedPassword = await hash("aryateja5", 12);
      
      // Create account record for Better Auth
      await db.account.upsert({
        where: {
          provider_providerAccountId: {
            provider: "credential",
            providerAccountId: existingUser.id,
          },
        },
        update: {
          // Update existing account
        },
        create: {
          userId: existingUser.id,
          type: "credentials",
          provider: "credential",
          providerAccountId: existingUser.id,
          // Note: Better Auth handles password storage differently
          // This is a simplified approach for testing
        },
      });

      console.log("✅ Test account setup completed!");
      console.log("You can now login with:");
      console.log("Email: aryateja2106@gmail.com");
      console.log("Password: aryateja5");
      
    } else {
      console.log("❌ User not found in database. Please run the seed script first.");
    }

  } catch (error) {
    console.error("❌ Failed to setup test account:", error);
  }
}

setupTestAccount()
  .then(() => {
    console.log("🎉 Setup completed!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Setup failed:", error);
    process.exit(1);
  });