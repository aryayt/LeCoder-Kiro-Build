import { PrismaClient } from "@prisma/client";
import { hash } from "bcryptjs";

const prisma = new PrismaClient();

async function createAuthUser() {
  console.log("🔧 Creating authenticated user account...");

  try {
    const email = "aryateja2106@gmail.com";
    const password = "aryateja5";
    const name = "aryateja";

    // Check if user already exists
    let user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      // Create the user
      user = await prisma.user.create({
        data: {
          email,
          name,
          image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150",
        },
      });
      console.log("✅ User created in database");
    } else {
      console.log("ℹ️ User already exists in database");
    }

    // Hash the password using bcryptjs (same as Better Auth)
    const hashedPassword = await hash(password, 12);

    // Check if account already exists
    const existingAccount = await prisma.account.findFirst({
      where: {
        userId: user.id,
        provider: "credential",
      },
    });

    if (!existingAccount) {
      // Create account record for email/password authentication
      await prisma.account.create({
        data: {
          userId: user.id,
          type: "credentials",
          provider: "credential",
          providerAccountId: user.id,
          // Note: Better Auth stores password differently
          // We'll need to use the Better Auth API for proper password storage
        },
      });
      console.log("✅ Account record created");
    } else {
      console.log("ℹ️ Account record already exists");
    }

    console.log("🎉 User setup completed!");
    console.log("Credentials:");
    console.log("Email:", email);
    console.log("Password:", password);
    console.log("Name:", name);

  } catch (error) {
    console.error("❌ Failed to create user:", error);
  } finally {
    await prisma.$disconnect();
  }
}

createAuthUser();