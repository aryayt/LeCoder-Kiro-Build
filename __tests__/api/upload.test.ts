// Mock the database
jest.mock('~/server/db', () => ({
  db: {
    project: {
      create: jest.fn(),
    },
    pipelineStage: {
      createMany: jest.fn(),
    },
  },
}));

// Mock the PDF processor
jest.mock('~/lib/pdf/processor', () => ({
  validatePdfFile: jest.fn(),
  fileToBuffer: jest.fn(),
  extractTextFromPdf: jest.fn(),
}));

describe('PDF Upload API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should validate PDF files correctly', () => {
    const { validatePdfFile } = require('~/lib/pdf/processor');
    
    // Test valid PDF
    validatePdfFile.mockReturnValue(null);
    const validFile = { type: 'application/pdf', size: 1024, name: 'test.pdf' };
    expect(validatePdfFile(validFile)).toBeNull();

    // Test invalid file type
    validatePdfFile.mockReturnValue({
      message: 'Invalid file type',
      code: 'INVALID_FILE_TYPE',
    });
    const invalidFile = { type: 'text/plain', size: 1024, name: 'test.txt' };
    expect(validatePdfFile(invalidFile)).toEqual({
      message: 'Invalid file type',
      code: 'INVALID_FILE_TYPE',
    });
  });

  it('should process PDF text extraction', async () => {
    const { extractTextFromPdf } = require('~/lib/pdf/processor');
    
    extractTextFromPdf.mockResolvedValue({
      text: 'Extracted PDF text content',
      metadata: {
        title: 'Test Paper',
        author: 'Test Author',
        pages: 10,
        fileSize: 1024,
        fileName: 'test.pdf',
      },
    });

    const buffer = Buffer.from('test content');
    const result = await extractTextFromPdf(buffer, 'test.pdf');
    
    expect(result.text).toBe('Extracted PDF text content');
    expect(result.metadata.title).toBe('Test Paper');
    expect(result.metadata.pages).toBe(10);
  });

  it('should create project in database', async () => {
    const { db } = require('~/server/db');
    
    const mockProject = {
      id: 'test-project-id',
      title: 'Test Paper',
      status: 'UPLOADED',
      createdAt: new Date(),
    };

    db.project.create.mockResolvedValue(mockProject);
    db.pipelineStage.createMany.mockResolvedValue({ count: 6 });

    const projectData = {
      title: 'Test Paper',
      paperContent: 'Extracted content',
      metadata: { fileName: 'test.pdf', fileSize: 1024, pageCount: 10 },
      userId: null,
      status: 'UPLOADED',
      currentStage: 0,
    };

    const result = await db.project.create({ data: projectData });
    
    expect(result.id).toBe('test-project-id');
    expect(result.title).toBe('Test Paper');
    expect(db.project.create).toHaveBeenCalledWith({ data: projectData });
  });
});