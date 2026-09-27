import crypto from 'crypto';
import mammoth from 'mammoth';
import { PDFDocument, PDFName, PDFRawStream } from 'pdf-lib';
import sharp from 'sharp';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const pdfParse = require('pdf-parse');

export interface DocumentChunk {
  id: string;
  index: number;
  title: string;
  content: string;
  wordCount: number;
  pageRange?: { start: number; end: number };
}

export interface DocumentSection {
  sectionId: string;
  title: string;
  summary: string;
  keyConcepts: string[];
  chunkIndices: number[];
}

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
  chunks: DocumentChunk[];
  isLargeDocument: boolean;
}

export interface PageRange {
  start?: number;
  end?: number;
}

export interface DocumentUploadLimits {
  maxTypedSizeBytes: number; // 35 MB
  maxNonTypedSizeBytes: number; // 20 MB
  maxTotalSizeBytes: number; // 40 MB
  maxImageCount: number; // 25 images
  maxTypedTotalPages: number; // 100 pages
  maxScannedTotalPages: number; // 30 pages
}

export const DEFAULT_UPLOAD_LIMITS: DocumentUploadLimits = {
  maxTypedSizeBytes: 35 * 1024 * 1024,
  maxNonTypedSizeBytes: 20 * 1024 * 1024,
  maxTotalSizeBytes: 40 * 1024 * 1024,
  maxImageCount: 25,
  maxTypedTotalPages: 100,
  maxScannedTotalPages: 30,
};

export class DocumentProcessorService {
  /**
   * Normalize and downscale any image to max 1024x1024 JPEG using sharp.
   * Drastically cuts token and memory overhead while preserving crisp legibility.
   */
  public static async normalizeImageBuffer(buffer: Buffer): Promise<{ buffer: Buffer; mime: string }> {
    try {
      const resized = await sharp(buffer)
        .rotate() // auto-orient based on EXIF
        .resize(1024, 1024, {
          fit: 'inside',
          withoutEnlargement: true,
        })
        .jpeg({ quality: 80, mozjpeg: true })
        .toBuffer();

      return { buffer: resized, mime: 'image/jpeg' };
    } catch (err: any) {
      console.warn('sharp normalization warning, falling back to original:', err?.message);
      return { buffer, mime: 'image/jpeg' };
    }
  }

  /**
   * Pre-Processing Sanitization:
   * 1. Strips repeating headers and footers across pages.
   * 2. Strips page numbers (e.g. "Page 1 of 50", "1 / 50", "- 12 -", "Slide 4").
   * 3. Strips copyright notices and boilerplate disclaimers.
   * 4. Cleans excess whitespace.
   */
  public static sanitizeExtractedText(rawText: string): string {
    if (!rawText) return '';

    // Split into lines
    const lines = rawText.split(/\r?\n/);
    const lineFrequency: Record<string, number> = {};

    // Count frequency of normalized lines to detect repeating headers/footers
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.length > 4 && trimmed.length < 90) {
        lineFrequency[trimmed] = (lineFrequency[trimmed] || 0) + 1;
      }
    }

    const sanitizedLines: string[] = [];
    const boilerplateRegex = /(copyright\s*(©|\(c\))?|\bconfidential\b|all\s+rights\s+reserved|do\s+not\s+distribute|internal\s+use\s+only|terms\s+of\s+service)/i;
    const pageNumRegex = /^(page\s+\d+(\s+of\s+\d+)?|\d+\s*\/\s*\d+|-\s*\d+\s*-|slide\s+\d+(\s+of\s+\d+)?|\b\d{1,4}\b)$/i;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmed = line.trim();

      if (!trimmed) {
        sanitizedLines.push('');
        continue;
      }

      // Check if this line is a repeating header/footer (> 4 occurrences in multi-page document)
      if (lineFrequency[trimmed] && lineFrequency[trimmed] >= 4 && lines.length > 50) {
        continue;
      }

      // Strip page number artifacts
      if (pageNumRegex.test(trimmed)) {
        continue;
      }

      // Strip copyright and confidentiality notices
      if (boilerplateRegex.test(trimmed)) {
        continue;
      }

      sanitizedLines.push(line);
    }

    // Join and collapse excessive blank lines (more than 2 consecutive newlines)
    return sanitizedLines.join('\n').replace(/\n{3,}/g, '\n\n').trim();
  }

  /**
   * Slice a PDF buffer to a specific page range using pdf-lib.
   */
  public static async slicePdfPageRange(
    buffer: Buffer,
    pageRange?: PageRange
  ): Promise<{ buffer: Buffer; totalOriginalPages: number; slicedPages: number; startPage: number; endPage: number }> {
    const srcDoc = await PDFDocument.load(buffer, { ignoreEncryption: true });
    const totalOriginalPages = srcDoc.getPageCount();

    if (!pageRange || (!pageRange.start && !pageRange.end)) {
      return {
        buffer,
        totalOriginalPages,
        slicedPages: totalOriginalPages,
        startPage: 1,
        endPage: totalOriginalPages,
      };
    }

    const startPage = Math.max(1, pageRange.start || 1);
    const endPage = Math.min(totalOriginalPages, pageRange.end || totalOriginalPages);

    if (startPage === 1 && endPage === totalOriginalPages) {
      return {
        buffer,
        totalOriginalPages,
        slicedPages: totalOriginalPages,
        startPage,
        endPage,
      };
    }

    if (startPage > endPage) {
      throw new Error(`Invalid page range: start page (${startPage}) cannot be greater than end page (${endPage}).`);
    }

    const slicedDoc = await PDFDocument.create();
    const pageIndices: number[] = [];
    for (let i = startPage - 1; i < endPage; i++) {
      pageIndices.push(i);
    }

    const copiedPages = await slicedDoc.copyPages(srcDoc, pageIndices);
    copiedPages.forEach((p) => slicedDoc.addPage(p));
    const slicedBuffer = Buffer.from(await slicedDoc.save());

    return {
      buffer: slicedBuffer,
      totalOriginalPages,
      slicedPages: pageIndices.length,
      startPage,
      endPage,
    };
  }

  /**
   * Process multiple files (DOCX, PDF, Images) and enforce size and page constraints.
   * Prioritizes pure text extraction, performs sanitization, image downscaling, and hierarchical chunking.
   */
  public static async processUploads(
    files: Express.Multer.File[],
    userGuidePrompt = '',
    limits: DocumentUploadLimits = DEFAULT_UPLOAD_LIMITS,
    pageRange?: PageRange
  ): Promise<ProcessedDocumentResult> {
    if (!files || files.length === 0) {
      const sanitizedPrompt = this.sanitizeExtractedText(userGuidePrompt.trim());
      const promptChunks = sanitizedPrompt
        ? [
            {
              id: 'chunk-0',
              index: 0,
              title: 'User Guide Prompt',
              content: sanitizedPrompt,
              wordCount: sanitizedPrompt.split(/\s+/).filter(Boolean).length,
            },
          ]
        : [];

      return {
        extractedText: sanitizedPrompt,
        imageAttachments: [],
        detectedTypes: ['prompt_only'],
        totalPages: 0,
        fileSummaries: [],
        chunks: promptChunks,
        isLargeDocument: false,
      };
    }

    // 1. Separate files by type
    const imageFiles: Express.Multer.File[] = [];
    const documentFiles: Express.Multer.File[] = [];

    let totalImageBytes = 0;
    let totalDocBytes = 0;

    for (const file of files) {
      const mime = file.mimetype.toLowerCase();
      const name = file.originalname.toLowerCase();

      if (mime.startsWith('image/') || /\.(png|jpe?g|webp|gif)$/i.test(name)) {
        imageFiles.push(file);
        totalImageBytes += file.size;
      } else if (
        mime === 'application/pdf' ||
        /\.pdf$/i.test(name) ||
        mime.includes('wordprocessingml') ||
        mime.includes('msword') ||
        /\.docx?$/i.test(name)
      ) {
        documentFiles.push(file);
        totalDocBytes += file.size;
      } else {
        throw new Error(
          `Unsupported file format: "${file.originalname}". Only PDF, DOCX, and images (JPEG, PNG, WEBP) are supported.`
        );
      }
    }

    // Check size limits
    if (totalImageBytes > limits.maxNonTypedSizeBytes) {
      const sizeMb = (totalImageBytes / (1024 * 1024)).toFixed(1);
      throw new Error(`Images/photos total size exceeds the 20MB limit (uploaded: ${sizeMb}MB).`);
    }

    if (totalDocBytes > limits.maxTypedSizeBytes) {
      const sizeMb = (totalDocBytes / (1024 * 1024)).toFixed(1);
      throw new Error(`Documents total size exceeds the 35MB limit (uploaded: ${sizeMb}MB).`);
    }

    const totalPayloadBytes = totalImageBytes + totalDocBytes;
    if (totalPayloadBytes > limits.maxTotalSizeBytes) {
      const sizeMb = (totalPayloadBytes / (1024 * 1024)).toFixed(1);
      throw new Error(`Total upload exceeds the 40MB maximum allowed limit (uploaded: ${sizeMb}MB).`);
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
    const seenImageHashes = new Set<string>();
    let totalPagesAccumulator = 0;
    let hasScannedPdf = false;

    // 2. Process image files directly with normalization and deduplication
    for (const img of imageFiles) {
      const hash = crypto.createHash('sha256').update(img.buffer).digest('hex');
      if (seenImageHashes.has(hash)) {
        // Skip duplicate image
        continue;
      }
      seenImageHashes.add(hash);

      const normalized = await this.normalizeImageBuffer(img.buffer);
      const base64Data = normalized.buffer.toString('base64');
      const dataUrl = `data:${normalized.mime};base64,${base64Data}`;

      imageAttachments.push(dataUrl);
      detectedTypes.add('image');
      fileSummaries.push({
        name: img.originalname,
        type: 'image',
        size: normalized.buffer.length,
      });
    }

    // 3. Process document files (PDF & DOCX)
    for (const doc of documentFiles) {
      const name = doc.originalname.toLowerCase();
      const isPdf = doc.mimetype === 'application/pdf' || name.endsWith('.pdf');
      const isDocx = name.endsWith('.docx') || name.endsWith('.doc') || doc.mimetype.includes('word');

      if (isPdf) {
        // Optional page range slicing
        let pdfBuffer = doc.buffer;
        let effectivePages = 1;

        if (pageRange && (pageRange.start || pageRange.end)) {
          const sliceResult = await this.slicePdfPageRange(pdfBuffer, pageRange);
          pdfBuffer = sliceResult.buffer;
          effectivePages = sliceResult.slicedPages;
        }

        const pdfResult = await this.processPdf(pdfBuffer, doc.originalname, limits, seenImageHashes);
        const pagesCounted = effectivePages > 1 ? effectivePages : pdfResult.pages;
        totalPagesAccumulator += pagesCounted;

        if (pdfResult.docType.includes('scanned')) {
          hasScannedPdf = true;
          if (totalPagesAccumulator > limits.maxScannedTotalPages) {
            throw new Error(
              `Scanned/handwritten document exceeded the limit of ${limits.maxScannedTotalPages} pages (total: ${totalPagesAccumulator} pages). For large files, use a typed PDF or select a specific page range.`
            );
          }
        } else {
          if (totalPagesAccumulator > limits.maxTypedTotalPages) {
            throw new Error(
              `Document pages exceeded the maximum limit of ${limits.maxTypedTotalPages} pages (total: ${totalPagesAccumulator} pages). Please select a specific page range.`
            );
          }
        }

        if (pdfResult.extractedText) {
          const cleanDocText = this.sanitizeExtractedText(pdfResult.extractedText);
          if (cleanDocText) {
            combinedText += `\n--- CONTENT FROM DOCUMENT: ${doc.originalname} ---\n${cleanDocText}\n`;
          }
        }

        if (pdfResult.images && pdfResult.images.length > 0) {
          for (const imgUrl of pdfResult.images) {
            if (imageAttachments.length < limits.maxImageCount) {
              imageAttachments.push(imgUrl);
            }
          }
        }

        detectedTypes.add(pdfResult.docType);
        fileSummaries.push({
          name: doc.originalname,
          type: pdfResult.docType,
          size: doc.size,
          pages: pagesCounted,
        });
      } else if (isDocx) {
        const docxResult = await this.processDocx(doc.buffer, doc.originalname);
        totalPagesAccumulator += docxResult.pages;

        if (totalPagesAccumulator > limits.maxTypedTotalPages) {
          throw new Error(
            `Total document pages exceeded the maximum limit of ${limits.maxTypedTotalPages} pages (accumulated ${totalPagesAccumulator} pages).`
          );
        }

        const cleanDocxText = this.sanitizeExtractedText(docxResult.text);
        if (cleanDocxText) {
          combinedText += `\n--- CONTENT FROM DOCUMENT: ${doc.originalname} ---\n${cleanDocxText}\n`;
        }

        detectedTypes.add('typed_docx');
        fileSummaries.push({
          name: doc.originalname,
          type: 'typed_docx',
          size: doc.size,
          pages: docxResult.pages,
        });
      }
    }

    const sanitizedFullText = this.sanitizeExtractedText(combinedText.trim());

    // 4. Create structured chunks for hierarchical mapping
    const chunks = this.createDocumentChunks(sanitizedFullText);

    // Large document flag if > 20 pages or > 6 structured chunks
    const isLargeDocument = totalPagesAccumulator > 20 || chunks.length > 6;

    return {
      extractedText: sanitizedFullText,
      imageAttachments,
      detectedTypes: Array.from(detectedTypes),
      totalPages: totalPagesAccumulator,
      fileSummaries,
      chunks,
      isLargeDocument,
    };
  }

  /**
   * Parse PDF buffer, prioritize pure text extraction, detect density,
   * and only extract/normalize images when text density is low (e.g. scanned/slides).
   */
  private static async processPdf(
    buffer: Buffer,
    filename: string,
    limits: DocumentUploadLimits,
    seenImageHashes: Set<string>
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

    // If text density is high (>= 30 words per page), it is a typed PDF!
    // PRIORITIZE PURE TEXT: Do NOT extract decorative icons or logos.
    if (avgWordsPerPage >= 30) {
      return {
        pages: numPages,
        extractedText,
        images: [],
        docType: 'typed_pdf',
      };
    }

    // If text is sparse or absent, it is likely a scanned, handwritten, or slide-based PDF.
    // Extract embedded images, filter blanks/duplicates, and normalize to 1024x1024 JPEG.
    try {
      const pdfDoc = await PDFDocument.load(buffer, { ignoreEncryption: true });
      numPages = pdfDoc.getPageCount() || numPages;

      const objects = pdfDoc.context.enumerateIndirectObjects();
      for (const [, obj] of objects) {
        if (obj instanceof PDFRawStream) {
          const dict = obj.dict;
          const subtype = dict.get(PDFName.of('Subtype'));
          if (subtype === PDFName.of('Image')) {
            const rawBytes = Buffer.from(obj.contents);
            // Skip tiny icons (< 3KB)
            if (rawBytes.length < 3072) continue;

            const hash = crypto.createHash('sha256').update(rawBytes).digest('hex');
            if (seenImageHashes.has(hash)) continue;
            seenImageHashes.add(hash);

            try {
              const normalized = await this.normalizeImageBuffer(rawBytes);
              const base64Data = normalized.buffer.toString('base64');
              images.push(`data:${normalized.mime};base64,${base64Data}`);

              if (images.length >= limits.maxImageCount) break;
            } catch {
              // Ignore image normalization failure
            }
          }
        }
      }
    } catch (libErr: any) {
      console.warn(`pdf-lib image extraction on ${filename}:`, libErr.message);
    }

    const docType = images.length > 0 ? 'scanned_or_handwritten_pdf' : extractedText ? 'mixed_pdf' : 'scanned_pdf';

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

  /**
   * Split sanitized document text into logical sections/chunks (~1,200 - 1,500 words with overlap).
   * Respects natural document boundaries like slide markers, headings, and chapter dividers.
   */
  public static createDocumentChunks(text: string): DocumentChunk[] {
    if (!text || text.trim().length === 0) return [];

    const lines = text.split('\n');
    const chunks: DocumentChunk[] = [];
    let currentLines: string[] = [];
    let currentWords = 0;
    const TARGET_CHUNK_WORDS = 1300;
    const OVERLAP_WORDS = 100;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const lineWords = line.split(/\s+/).filter(Boolean).length;

      // Detect strong structural markers (e.g. "--- Page X ---", "# Chapter", "Module ")
      const isHeaderMarker =
        lineWords > 0 &&
        lineWords < 12 &&
        (/^(---|===|\#{1,3}\s|chapter\s+\d+|module\s+\d+|section\s+\d+|lecture\s+\d+)/i.test(line.trim()));

      if (currentWords >= TARGET_CHUNK_WORDS || (isHeaderMarker && currentWords >= 700)) {
        const chunkContent = currentLines.join('\n').trim();
        if (chunkContent.length > 40) {
          const chunkIndex = chunks.length;
          // Determine title from first non-empty line or marker
          const firstLine = currentLines.find((l) => l.trim().length > 3) || `Section ${chunkIndex + 1}`;
          const cleanTitle = firstLine.replace(/^[-=#*\s]+/, '').slice(0, 70).trim() || `Section ${chunkIndex + 1}`;

          chunks.push({
            id: `chunk-${chunkIndex}`,
            index: chunkIndex,
            title: cleanTitle,
            content: chunkContent,
            wordCount: currentWords,
          });
        }

        // Take last few lines for overlap context
        const overlapLines: string[] = [];
        let overlapCount = 0;
        for (let j = currentLines.length - 1; j >= 0; j--) {
          const words = currentLines[j].split(/\s+/).filter(Boolean).length;
          if (overlapCount + words <= OVERLAP_WORDS) {
            overlapLines.unshift(currentLines[j]);
            overlapCount += words;
          } else {
            break;
          }
        }

        currentLines = [...overlapLines];
        currentWords = overlapCount;
      }

      currentLines.push(line);
      currentWords += lineWords;
    }

    if (currentLines.length > 0) {
      const remainingContent = currentLines.join('\n').trim();
      if (remainingContent.length > 40) {
        const chunkIndex = chunks.length;
        const firstLine = currentLines.find((l) => l.trim().length > 3) || `Section ${chunkIndex + 1}`;
        const cleanTitle = firstLine.replace(/^[-=#*\s]+/, '').slice(0, 70).trim() || `Section ${chunkIndex + 1}`;

        chunks.push({
          id: `chunk-${chunkIndex}`,
          index: chunkIndex,
          title: cleanTitle,
          content: remainingContent,
          wordCount: currentWords,
        });
      }
    }

    return chunks;
  }
}
