import mammoth from 'mammoth';
import { PDFDocument, PDFName, PDFRawStream } from 'pdf-lib';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const pdfParse = require('pdf-parse');

export interface ProcessedDocumentResult {
  extractedText: string;
  imageAttachments: string[];
  detectedTypes: string[];
  totalPages: number;
  fileSummaries: Array<{
    name: string;
    type: string;
    size: number;
    pages?: number;
  }>;
}

export interface DocumentUploadLimits {
  maxTotalSizeBytes: number; // 15 MB
  maxImageCount: number; // 15 images
  maxTotalPages: number; // 20 pages
}

export const DEFAULT_UPLOAD_LIMITS: DocumentUploadLimits = {
  maxTotalSizeBytes: 15 * 1024 * 1024,
  maxImageCount: 15,
  maxTotalPages: 20,
};

export class DocumentProcessorService {
  /**
   * Process multiple files (DOCX, PDF, Images) and enforce size and page constraints.
   */
  public static async processUploads(
    files: Express.Multer.File[],
    userGuidePrompt = '',
    limits: DocumentUploadLimits = DEFAULT_UPLOAD_LIMITS
  ): Promise<ProcessedDocumentResult> {
    if (!files || files.length === 0) {
      return {
        extractedText: userGuidePrompt.trim(),
        imageAttachments: [],
        detectedTypes: ['prompt_only'],
        totalPages: 0,
        fileSummaries: [],
      };
    }

    // 1. Check total payload size
    const totalSize = files.reduce((acc, f) => acc + f.size, 0);
    if (totalSize > limits.maxTotalSizeBytes) {
      const sizeMb = (totalSize / (1024 * 1024)).toFixed(2);
      throw new Error(
        `Total upload size exceeds the maximum limit of 15MB (total size: ${sizeMb}MB).`
      );
    }

    // 2. Separate and count image files vs document files
    const imageFiles: Express.Multer.File[] = [];
    const documentFiles: Express.Multer.File[] = [];

    for (const file of files) {
      const mime = file.mimetype.toLowerCase();
      const name = file.originalname.toLowerCase();

      if (mime.startsWith('image/') || /\.(png|jpe?g|webp|gif)$/i.test(name)) {
        imageFiles.push(file);
      } else if (
        mime === 'application/pdf' ||
        /\.pdf$/i.test(name) ||
        mime.includes('wordprocessingml') ||
        mime.includes('msword') ||
        /\.docx?$/i.test(name)
      ) {
        documentFiles.push(file);
      } else {
        throw new Error(
          `Unsupported file format: "${file.originalname}". Only PDF, DOCX, and images (JPEG, PNG, WEBP) are supported.`
        );
      }
    }

    if (imageFiles.length > limits.maxImageCount) {
      throw new Error(
        `Maximum number of images exceeded. You uploaded ${imageFiles.length} images, but the maximum allowed is ${limits.maxImageCount}.`
      );
    }

    let combinedText = userGuidePrompt ? `USER GUIDE / INSTRUCTIONS:\n${userGuidePrompt.trim()}\n\n` : '';
    const imageAttachments: string[] = [];
    const detectedTypes: Set<string> = new Set();
    const fileSummaries: Array<{ name: string; type: string; size: number; pages?: number }> = [];
    let totalPagesAccumulator = 0;

    // 3. Process image files directly
    for (const img of imageFiles) {
      const mimeType = img.mimetype && img.mimetype.startsWith('image/') ? img.mimetype : 'image/jpeg';
      const base64Data = img.buffer.toString('base64');
      const dataUrl = `data:${mimeType};base64,${base64Data}`;
      imageAttachments.push(dataUrl);
      detectedTypes.add('image');
      fileSummaries.push({
        name: img.originalname,
        type: 'image',
        size: img.size,
      });
    }

    // 4. Process document files (PDF & DOCX)
    for (const doc of documentFiles) {
      const name = doc.originalname.toLowerCase();
      const isPdf = doc.mimetype === 'application/pdf' || name.endsWith('.pdf');
      const isDocx = name.endsWith('.docx') || name.endsWith('.doc') || doc.mimetype.includes('word');

      if (isPdf) {
        const pdfResult = await this.processPdf(doc.buffer, doc.originalname);
        totalPagesAccumulator += pdfResult.pages;

        if (totalPagesAccumulator > limits.maxTotalPages) {
          throw new Error(
            `Total document pages exceeded the maximum limit of ${limits.maxTotalPages} pages (accumulated ${totalPagesAccumulator} pages).`
          );
        }

        if (pdfResult.extractedText) {
          combinedText += `\n--- CONTENT FROM DOCUMENT: ${doc.originalname} ---\n${pdfResult.extractedText}\n`;
        }

        if (pdfResult.images && pdfResult.images.length > 0) {
          for (const imgUrl of pdfResult.images) {
            if (imageAttachments.length < limits.maxImageCount + 10) {
              imageAttachments.push(imgUrl);
            }
          }
        }

        detectedTypes.add(pdfResult.docType);
        fileSummaries.push({
          name: doc.originalname,
          type: pdfResult.docType,
          size: doc.size,
          pages: pdfResult.pages,
        });
      } else if (isDocx) {
        const docxResult = await this.processDocx(doc.buffer, doc.originalname);
        totalPagesAccumulator += docxResult.pages;

        if (totalPagesAccumulator > limits.maxTotalPages) {
          throw new Error(
            `Total document pages exceeded the maximum limit of ${limits.maxTotalPages} pages (accumulated ${totalPagesAccumulator} pages).`
          );
        }

        combinedText += `\n--- CONTENT FROM DOCUMENT: ${doc.originalname} ---\n${docxResult.text}\n`;
        detectedTypes.add('typed_docx');
        fileSummaries.push({
          name: doc.originalname,
          type: 'typed_docx',
          size: doc.size,
          pages: docxResult.pages,
        });
      }
    }

    return {
      extractedText: combinedText.trim(),
      imageAttachments,
      detectedTypes: Array.from(detectedTypes),
      totalPages: totalPagesAccumulator,
      fileSummaries,
    };
  }

  /**
   * Parse PDF buffer, detect if it is typed vs scanned/handwritten, and extract text/images.
   */
  private static async processPdf(
    buffer: Buffer,
    filename: string
  ): Promise<{ pages: number; extractedText: string; images: string[]; docType: string }> {
    let numPages = 1;
    let extractedText = '';
    const images: string[] = [];

    try {
      if (typeof pdfParse === 'function') {
        const parsed = await pdfParse(buffer);
        numPages = parsed.numpages || parsed.total || 1;
        extractedText = (parsed.text || '').trim();
      } else if (pdfParse?.PDFParse) {
        const parser = new pdfParse.PDFParse({ data: buffer });
        const res = await parser.getText();
        numPages = res.total || res.pages?.length || 1;
        extractedText = (res.text || '').trim();
      }
    } catch (err: any) {
      console.warn(`pdf-parse warning on ${filename}:`, err.message);
    }

    const wordCount = extractedText ? extractedText.split(/\s+/).filter(Boolean).length : 0;
    const avgWordsPerPage = numPages > 0 ? wordCount / numPages : 0;

    // If text density is high (>= 30 words per page), consider it a typed PDF
    if (avgWordsPerPage >= 30) {
      return {
        pages: numPages,
        extractedText,
        images: [],
        docType: 'typed_pdf',
      };
    }

    // If text is low or empty, it is likely a scanned, handwritten, or slide-based PDF.
    // Try extracting embedded images directly using pdf-lib
    try {
      const pdfDoc = await PDFDocument.load(buffer, { ignoreEncryption: true });
      numPages = pdfDoc.getPageCount() || numPages;

      const objects = pdfDoc.context.enumerateIndirectObjects();
      for (const [, obj] of objects) {
        if (obj instanceof PDFRawStream) {
          const dict = obj.dict;
          const subtype = dict.get(PDFName.of('Subtype'));
          if (subtype === PDFName.of('Image')) {
            const filter = dict.get(PDFName.of('Filter'));
            const isJpeg = filter === PDFName.of('DCTDecode');
            const mime = isJpeg ? 'image/jpeg' : 'image/png';
            const imgBase64 = Buffer.from(obj.contents).toString('base64');
            // Filter out tiny icon artifacts (< 2KB)
            if (imgBase64.length > 2000) {
              images.push(`data:${mime};base64,${imgBase64}`);
            }
          }
        }
      }
    } catch (libErr: any) {
      console.warn(`pdf-lib image extraction on ${filename}:`, libErr.message);
    }

    const docType = images.length > 0 ? 'scanned_or_handwritten_pdf' : (extractedText ? 'mixed_pdf' : 'scanned_pdf');

    return {
      pages: numPages,
      extractedText,
      images,
      docType,
    };
  }

  /**
   * Parse DOCX document and estimate page count based on word count.
   */
  private static async processDocx(
    buffer: Buffer,
    _filename: string
  ): Promise<{ text: string; pages: number }> {
    const result = await mammoth.extractRawText({ buffer });
    const text = (result.value || '').trim();
    const wordCount = text ? text.split(/\s+/).filter(Boolean).length : 0;
    // Standard estimation: ~350 words per page in typical formatted documents
    const estimatedPages = Math.max(1, Math.ceil(wordCount / 350));

    return {
      text,
      pages: estimatedPages,
    };
  }
}
