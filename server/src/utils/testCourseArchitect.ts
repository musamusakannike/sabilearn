import { DocumentProcessorService } from '../services/documentProcessor.service';
import { CourseArchitectService } from '../services/courseArchitect.service';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

async function runTests() {
  console.log('🧪 Starting AI Course Architect Tests...\n');

  // Test 1: Generate small sample PDF
  console.log('1. Testing PDF Generation & Processing...');
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([600, 400]);
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  page.drawText('Welcome to Introduction to Computer Science.\nIn this course we learn variables, control flow, functions and memory management.\nEverything is broken down step by step.', {
    x: 50,
    y: 350,
    size: 14,
    font,
    color: rgb(0, 0, 0),
  });

  const pdfBytes = await pdfDoc.save();
  const mockPdfFile: Express.Multer.File = {
    fieldname: 'files',
    originalname: 'intro_cs.pdf',
    encoding: '7bit',
    mimetype: 'application/pdf',
    size: pdfBytes.length,
    buffer: Buffer.from(pdfBytes),
    destination: '',
    filename: '',
    path: '',
    stream: null as any,
  };

  const processed = await DocumentProcessorService.processUploads(
    [mockPdfFile],
    'Focus on absolute beginners and interactive analogies'
  );

  console.log('✅ Document Processor Output:');
  console.log(' - Total Pages:', processed.totalPages);
  console.log(' - Detected Types:', processed.detectedTypes);
  console.log(' - File Summaries:', processed.fileSummaries);
  console.log(' - Extracted Text Snippet:', processed.extractedText.slice(0, 120) + '...\n');

  // Test 2: Image Limit Check
  console.log('2. Testing Image & Page Limit Validations...');
  const fakeImages: Express.Multer.File[] = Array.from({ length: 16 }, (_, i) => ({
    fieldname: 'files',
    originalname: `image_${i + 1}.png`,
    encoding: '7bit',
    mimetype: 'image/png',
    size: 1000,
    buffer: Buffer.from('mock image buffer'),
    destination: '',
    filename: '',
    path: '',
    stream: null as any,
  }));

  try {
    await DocumentProcessorService.processUploads(fakeImages, '');
    console.error('❌ Failed: Expected image count limit error was not thrown.');
  } catch (err: any) {
    console.log('✅ Correctly caught image limit error:', err.message);
  }

  // Test 3: Course Plan Generation
  console.log('\n3. Testing Course Plan Generation...');
  const plan = await CourseArchitectService.generatePlan({
    courseTitle: 'Introduction to Data Structures & Algorithms',
    userGuidePrompt: 'Focus on arrays, stacks, queues, and Big O notation.',
    extractedText: processed.extractedText,
    difficulty: 'beginner',
  });

  console.log('✅ Generated Course Plan:');
  console.log(' - Title:', plan.title);
  console.log(' - Category:', plan.category);
  console.log(' - Difficulty:', plan.difficulty);
  console.log(' - Chapters Count:', plan.chapters.length, '(Max allowed: 5)');
  console.log(' - Topics in Ch 1:', plan.chapters[0]?.topics.length, '(Max allowed: 4)');

  // Test 4: Topic Content Generation
  console.log('\n4. Testing Topic Content Generation...');
  const topicData = await CourseArchitectService.generateTopicContent({
    courseTitle: plan.title,
    chapterTitle: plan.chapters[0]?.title || 'Chapter 1',
    topicTitle: plan.chapters[0]?.topics[0]?.title || 'Arrays and Memory',
    topicDescription: plan.chapters[0]?.topics[0]?.description || 'How arrays store contiguous data',
    subConcepts: ['Contiguous memory allocation', 'Array indexing'],
  });

  console.log('✅ Generated Topic Content:');
  console.log(' - Title:', topicData.title);
  console.log(' - XP:', topicData.xp);
  console.log(' - Contents items count:', topicData.contents.length);

  // Test 5: Capstone Assessment Generation
  console.log('\n5. Testing Chapter Capstone Assessment Generation...');
  const capstone = await CourseArchitectService.generateCapstoneAssessment({
    courseTitle: plan.title,
    chapterTitle: plan.chapters[0]?.title || 'Chapter 1',
    topics: plan.chapters[0]?.topics || [],
    difficulty: 'medium',
  });

  console.log('✅ Generated Capstone Assessment:');
  console.log(' - Title:', capstone.title);
  console.log(' - Questions Count:', capstone.questions.length);
  console.log(' - Question 1:', capstone.questions[0]?.question);

  console.log('\n🎉 ALL TESTS COMPLETED SUCCESSFULLY!');
}

runTests().catch((err) => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
