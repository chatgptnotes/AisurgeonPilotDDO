import * as pdfjsLib from 'pdfjs-dist';

// Set up the worker for PDF.js
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

export interface PDFTextExtractorOptions {
  pageRange?: {
    start: number;
    end: number;
  };
  includeMetadata?: boolean;
}

export interface ExtractedPDFContent {
  text: string;
  pageCount: number;
  metadata?: {
    title?: string;
    author?: string;
    subject?: string;
    creator?: string;
    producer?: string;
    creationDate?: Date;
    modificationDate?: Date;
  };
}

/**
 * Extract text content from a PDF file
 */
export const extractTextFromPDF = async (
  file: File,
  options: PDFTextExtractorOptions = {}
): Promise<string> => {
  try {
    // Convert file to array buffer
    const arrayBuffer = await file.arrayBuffer();

    // Load the PDF document
    const pdf = await pdfjsLib.getDocument({
      data: arrayBuffer,
      cMapUrl: `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/cmaps/`,
      cMapPacked: true,
    }).promise;

    const pageCount = pdf.numPages;
    const { pageRange } = options;

    // Determine which pages to extract
    const startPage = pageRange?.start ?? 1;
    const endPage = pageRange?.end ?? pageCount;

    let fullText = '';

    // Extract text from each page
    for (let pageNum = startPage; pageNum <= Math.min(endPage, pageCount); pageNum++) {
      const page = await pdf.getPage(pageNum);
      const textContent = await page.getTextContent();

      // Combine text items into readable text
      const pageText = textContent.items
        .map((item: any) => {
          if ('str' in item) {
            return item.str;
          }
          return '';
        })
        .join(' ')
        .replace(/\s+/g, ' ') // Replace multiple whitespace with single space
        .trim();

      if (pageText) {
        fullText += `${pageText}\n\n`;
      }
    }

    return fullText.trim();

  } catch (error) {
    console.error('Error extracting text from PDF:', error);
    throw new Error(`Failed to extract text from PDF: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

/**
 * Extract text content and metadata from a PDF file
 */
export const extractPDFContent = async (
  file: File,
  options: PDFTextExtractorOptions = {}
): Promise<ExtractedPDFContent> => {
  try {
    const arrayBuffer = await file.arrayBuffer();

    const pdf = await pdfjsLib.getDocument({
      data: arrayBuffer,
      cMapUrl: `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/cmaps/`,
      cMapPacked: true,
    }).promise;

    const pageCount = pdf.numPages;

    // Extract text
    const text = await extractTextFromPDF(file, options);

    // Extract metadata if requested
    let metadata;
    if (options.includeMetadata) {
      const pdfMetadata = await pdf.getMetadata();
      metadata = {
        title: pdfMetadata.info?.Title,
        author: pdfMetadata.info?.Author,
        subject: pdfMetadata.info?.Subject,
        creator: pdfMetadata.info?.Creator,
        producer: pdfMetadata.info?.Producer,
        creationDate: pdfMetadata.info?.CreationDate ? new Date(pdfMetadata.info.CreationDate) : undefined,
        modificationDate: pdfMetadata.info?.ModDate ? new Date(pdfMetadata.info.ModDate) : undefined,
      };
    }

    return {
      text,
      pageCount,
      metadata,
    };

  } catch (error) {
    console.error('Error extracting PDF content:', error);
    throw new Error(`Failed to extract PDF content: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

/**
 * Check if a file is a valid PDF
 */
export const isPDFFile = (file: File): boolean => {
  return file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
};

/**
 * Get basic PDF information without extracting full content
 */
export const getPDFInfo = async (file: File) => {
  try {
    const arrayBuffer = await file.arrayBuffer();

    const pdf = await pdfjsLib.getDocument({
      data: arrayBuffer,
      cMapUrl: `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/cmaps/`,
      cMapPacked: true,
    }).promise;

    const metadata = await pdf.getMetadata();

    return {
      pageCount: pdf.numPages,
      title: metadata.info?.Title,
      author: metadata.info?.Author,
      subject: metadata.info?.Subject,
      fileSize: file.size,
      fileName: file.name,
    };

  } catch (error) {
    console.error('Error getting PDF info:', error);
    throw new Error(`Failed to get PDF information: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

/**
 * Extract text from specific pages of a PDF
 */
export const extractTextFromPDFPages = async (
  file: File,
  pageNumbers: number[]
): Promise<Record<number, string>> => {
  try {
    const arrayBuffer = await file.arrayBuffer();

    const pdf = await pdfjsLib.getDocument({
      data: arrayBuffer,
      cMapUrl: `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/cmaps/`,
      cMapPacked: true,
    }).promise;

    const result: Record<number, string> = {};

    for (const pageNum of pageNumbers) {
      if (pageNum < 1 || pageNum > pdf.numPages) {
        console.warn(`Page ${pageNum} is out of range (PDF has ${pdf.numPages} pages)`);
        continue;
      }

      const page = await pdf.getPage(pageNum);
      const textContent = await page.getTextContent();

      const pageText = textContent.items
        .map((item: any) => {
          if ('str' in item) {
            return item.str;
          }
          return '';
        })
        .join(' ')
        .replace(/\s+/g, ' ')
        .trim();

      result[pageNum] = pageText;
    }

    return result;

  } catch (error) {
    console.error('Error extracting text from PDF pages:', error);
    throw new Error(`Failed to extract text from PDF pages: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

/**
 * Search for specific text patterns in a PDF
 */
export const searchInPDF = async (
  file: File,
  searchTerms: string[]
): Promise<{
  found: boolean;
  matches: Array<{
    term: string;
    page: number;
    context: string;
  }>;
}> => {
  try {
    const text = await extractTextFromPDF(file);
    const lowerText = text.toLowerCase();

    const matches: Array<{
      term: string;
      page: number;
      context: string;
    }> = [];

    for (const term of searchTerms) {
      const lowerTerm = term.toLowerCase();
      if (lowerText.includes(lowerTerm)) {
        const index = lowerText.indexOf(lowerTerm);
        const contextStart = Math.max(0, index - 50);
        const contextEnd = Math.min(text.length, index + term.length + 50);
        const context = text.substring(contextStart, contextEnd);

        matches.push({
          term,
          page: 1, // Simple implementation - would need more complex logic to determine actual page
          context: context.trim(),
        });
      }
    }

    return {
      found: matches.length > 0,
      matches,
    };

  } catch (error) {
    console.error('Error searching in PDF:', error);
    throw new Error(`Failed to search in PDF: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};