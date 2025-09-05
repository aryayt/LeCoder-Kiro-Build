import { NextRequest, NextResponse } from "next/server";
import { extractTextFromPdf, validatePdfFile, fileToBuffer } from "~/lib/pdf/processor";
import { db } from "~/server/db";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const userId = formData.get("userId") as string | null;

    if (!file) {
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 }
      );
    }

    // Validate the file
    const validationError = validatePdfFile(file);
    if (validationError) {
      return NextResponse.json(
        { error: validationError.message, code: validationError.code },
        { status: 400 }
      );
    }

    // Convert file to buffer for processing
    const buffer = await fileToBuffer(file);

    // Extract text from PDF
    let processingResult;
    try {
      processingResult = await extractTextFromPdf(buffer, file.name);
    } catch (error) {
      console.error("Server-side PDF processing failed:", error);
      
      // For now, we'll return an error. In a full implementation,
      // you would implement client-side fallback here
      return NextResponse.json(
        { 
          error: "Failed to process PDF. Please try a different file.", 
          code: "PDF_PROCESSING_FAILED" 
        },
        { status: 500 }
      );
    }

    // Create project in database
    const project = await db.project.create({
      data: {
        title: processingResult.metadata.title || file.name.replace('.pdf', ''),
        paperContent: processingResult.text,
        metadata: {
          fileName: processingResult.metadata.fileName,
          fileSize: processingResult.metadata.fileSize,
          pageCount: processingResult.metadata.pages,
          authors: processingResult.metadata.author ? [processingResult.metadata.author] : [],
        },
        userId: userId || null,
        status: 'UPLOADED',
        currentStage: 0,
      },
    });

    // Create the initial pipeline stages
    const stages = [
      { name: 'Concept Extraction', description: 'Extracting core concepts and research objectives' },
      { name: 'Algorithm Analysis', description: 'Identifying algorithms and methodologies' },
      { name: 'Architecture Planning', description: 'Determining system structure and requirements' },
      { name: 'Implementation Planning', description: 'Creating detailed implementation plan' },
      { name: 'Code Generation', description: 'Generating complete, executable code' },
      { name: 'Documentation Generation', description: 'Creating setup instructions and documentation' },
    ];

    await db.pipelineStage.createMany({
      data: stages.map((stage, index) => ({
        projectId: project.id,
        stageNumber: index + 1,
        stageName: stage.name,
        status: 'PENDING',
        inputData: {},
        outputData: {},
      })),
    });

    return NextResponse.json({
      success: true,
      project: {
        id: project.id,
        title: project.title,
        status: project.status,
        metadata: project.metadata,
        createdAt: project.createdAt,
      },
      message: "PDF uploaded and processed successfully",
    });

  } catch (error) {
    console.error("Upload error:", error);
    
    return NextResponse.json(
      { 
        error: "Internal server error during upload", 
        code: "UPLOAD_ERROR" 
      },
      { status: 500 }
    );
  }
}

// Handle OPTIONS for CORS
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}