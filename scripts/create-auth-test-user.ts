import { auth } from "~/lib/auth";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function createAuthTestUser() {
  console.log("🔧 Creating test user with Better Auth...");

  try {
    const email = "aryatest1@gmail.com";
    const password = "Aryateja@5";
    const name = "aryatest1";

    // First, check if user already exists in Better Auth system
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      console.log("ℹ️ User already exists, deleting to recreate...");
      // Delete existing user and related data
      await prisma.session.deleteMany({
        where: { userId: existingUser.id },
      });
      await prisma.account.deleteMany({
        where: { userId: existingUser.id },
      });
      await prisma.project.deleteMany({
        where: { userId: existingUser.id },
      });
      await prisma.user.delete({
        where: { id: existingUser.id },
      });
    }

    // Create user through Better Auth API (simulating registration)
    const response = await fetch("http://localhost:3000/api/auth/sign-up", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email,
        password,
        name,
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`Registration failed: ${response.status} - ${errorData}`);
    }

    const userData = await response.json();
    console.log("✅ User created through Better Auth");

    // Now get the created user from database
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new Error("User not found after creation");
    }

    // Create a sample project for this user
    const project = await prisma.project.create({
      data: {
        userId: user.id,
        title: "AI-Powered Code Generation Research",
        paperContent: `
Abstract: This paper explores the application of artificial intelligence for automated code generation
from natural language descriptions. We present a novel approach using transformer models.

Introduction: Automated code generation has become increasingly important in software development...

Methodology: Our approach consists of three main components:
1. Natural language processing for requirement analysis
2. Code pattern recognition using machine learning
3. Automated testing and validation

Results: Our experiments show significant improvements in code quality and development speed...
        `,
        status: "PROCESSING",
        currentStage: 1,
        metadata: {
          fileName: "ai_code_generation.pdf",
          fileSize: 1500000,
          pageCount: 8,
          authors: ["aryatest1"],
          abstract: "This paper explores the application of artificial intelligence for automated code generation from natural language descriptions.",
          keywords: ["AI", "code generation", "transformers", "NLP"],
        },
      },
    });

    // Create pipeline stages for the project
    const stages = [
      { name: "Concept Extraction", number: 1 },
      { name: "Algorithm Analysis", number: 2 },
      { name: "Architecture Planning", number: 3 },
      { name: "Implementation Planning", number: 4 },
      { name: "Code Generation", number: 5 },
      { name: "Documentation Generation", number: 6 },
    ];

    // Create first stage as completed, second as processing, rest as pending
    for (const stage of stages) {
      await prisma.pipelineStage.create({
        data: {
          projectId: project.id,
          stageNumber: stage.number,
          stageName: stage.name,
          status: stage.number === 1 ? "COMPLETED" : stage.number === 2 ? "PROCESSING" : "PENDING",
          inputData: stage.number <= 2 ? {
            stage: stage.number,
            description: `Input data for ${stage.name}`,
          } : undefined,
          outputData: stage.number === 1 ? {
            stage: stage.number,
            result: `Completed ${stage.name} successfully`,
            concepts: ["AI", "Code Generation", "Transformers"],
          } : undefined,
          startedAt: stage.number <= 2 ? new Date(Date.now() - (3 - stage.number) * 60000) : undefined,
          completedAt: stage.number === 1 ? new Date(Date.now() - 120000) : undefined,
        },
      });
    }

    console.log("✅ Sample project created");
    console.log("🎉 Test user setup completed!");
    console.log("Credentials for login:");
    console.log("Email:", email);
    console.log("Password:", password);
    console.log("Name:", name);
    console.log("");
    console.log("You can now login at: http://localhost:3000/auth/login");

  } catch (error) {
    console.error("❌ Failed to create user:", error);
  } finally {
    await prisma.$disconnect();
  }
}

createAuthTestUser();