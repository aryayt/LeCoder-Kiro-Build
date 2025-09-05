import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function createNewTestUser() {
  console.log("🔧 Creating new test user account...");

  try {
    const email = "aryatest1@gmail.com";
    const name = "aryatest1";

    // Check if user already exists
    let user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      // Create the user in database
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
      // Update the user info
      user = await prisma.user.update({
        where: { email },
        data: {
          name,
          image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150",
        },
      });
      console.log("✅ User info updated");
    }

    // Create a sample project for this user
    const existingProject = await prisma.project.findFirst({
      where: { userId: user.id },
    });

    if (!existingProject) {
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
    }

    console.log("🎉 Test user setup completed!");
    console.log("Credentials for registration:");
    console.log("Email:", email);
    console.log("Password: Aryateja@5");
    console.log("Name:", name);
    console.log("");
    console.log("The user has been added to the database. You can now:");
    console.log("1. Go to http://localhost:3000/auth/register");
    console.log("2. Fill in the form with the above credentials");
    console.log("3. The registration should work since the password meets all criteria");

  } catch (error) {
    console.error("❌ Failed to create user:", error);
  } finally {
    await prisma.$disconnect();
  }
}

createNewTestUser();