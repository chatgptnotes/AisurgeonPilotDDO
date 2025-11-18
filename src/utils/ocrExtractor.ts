import Tesseract from 'tesseract.js';

export interface OCROptions {
  language?: string;
  pageSegMode?: Tesseract.PSM;
  ocrEngineMode?: Tesseract.OEM;
  whitelist?: string;
  blacklist?: string;
}

export interface OCRResult {
  text: string;
  confidence: number;
  words?: Array<{
    text: string;
    confidence: number;
    bbox: {
      x0: number;
      y0: number;
      x1: number;
      y1: number;
    };
  }>;
}

/**
 * Extract text from an image file using Tesseract.js OCR
 */
export const extractTextFromImage = async (
  file: File,
  options: OCROptions = {}
): Promise<string> => {
  try {
    const {
      language = 'eng',
      pageSegMode = Tesseract.PSM.AUTO,
      ocrEngineMode = Tesseract.OEM.LSTM_ONLY,
      whitelist,
      blacklist
    } = options;

    // Create worker
    const worker = await Tesseract.createWorker(language);

    try {
      // Set parameters if provided
      if (whitelist) {
        await worker.setParameters({
          tessedit_char_whitelist: whitelist,
        });
      }

      if (blacklist) {
        await worker.setParameters({
          tessedit_char_blacklist: blacklist,
        });
      }

      // Set page segmentation mode
      await worker.setParameters({
        tessedit_pageseg_mode: pageSegMode,
        tessedit_ocr_engine_mode: ocrEngineMode,
      });

      // Perform OCR
      const { data } = await worker.recognize(file);

      return data.text.trim();

    } finally {
      // Always terminate the worker
      await worker.terminate();
    }

  } catch (error) {
    console.error('Error extracting text from image:', error);
    throw new Error(`Failed to extract text from image: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

/**
 * Extract detailed text information from an image including confidence and word positions
 */
export const extractDetailedTextFromImage = async (
  file: File,
  options: OCROptions = {}
): Promise<OCRResult> => {
  try {
    const {
      language = 'eng',
      pageSegMode = Tesseract.PSM.AUTO,
      ocrEngineMode = Tesseract.OEM.LSTM_ONLY,
      whitelist,
      blacklist
    } = options;

    const worker = await Tesseract.createWorker(language);

    try {
      // Set parameters
      if (whitelist) {
        await worker.setParameters({
          tessedit_char_whitelist: whitelist,
        });
      }

      if (blacklist) {
        await worker.setParameters({
          tessedit_char_blacklist: blacklist,
        });
      }

      await worker.setParameters({
        tessedit_pageseg_mode: pageSegMode,
        tessedit_ocr_engine_mode: ocrEngineMode,
      });

      // Perform OCR
      const { data } = await worker.recognize(file);

      // Extract word-level information
      const words = data.words?.map(word => ({
        text: word.text,
        confidence: word.confidence,
        bbox: {
          x0: word.bbox.x0,
          y0: word.bbox.y0,
          x1: word.bbox.x1,
          y1: word.bbox.y1,
        },
      }));

      return {
        text: data.text.trim(),
        confidence: data.confidence,
        words,
      };

    } finally {
      await worker.terminate();
    }

  } catch (error) {
    console.error('Error extracting detailed text from image:', error);
    throw new Error(`Failed to extract detailed text from image: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

/**
 * Extract text optimized for medical documents
 */
export const extractMedicalTextFromImage = async (
  file: File
): Promise<string> => {
  try {
    // Use configuration optimized for medical documents
    const options: OCROptions = {
      language: 'eng',
      pageSegMode: Tesseract.PSM.AUTO,
      ocrEngineMode: Tesseract.OEM.LSTM_ONLY,
      // Include medical terms and numbers
      whitelist: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789.,;:()/-+%°<>[]{}| ',
    };

    return await extractTextFromImage(file, options);

  } catch (error) {
    console.error('Error extracting medical text from image:', error);
    throw new Error(`Failed to extract medical text from image: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

/**
 * Check if a file is a supported image format
 */
export const isSupportedImageFile = (file: File): boolean => {
  const supportedTypes = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/tiff',
    'image/bmp',
    'image/webp'
  ];

  return supportedTypes.includes(file.type) ||
         file.name.toLowerCase().match(/\.(jpg|jpeg|png|tiff|tif|bmp|webp)$/);
};

/**
 * Preprocess image for better OCR results
 */
export const preprocessImageForOCR = (imageFile: File): Promise<File> => {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.onload = () => {
      try {
        // Set canvas size
        canvas.width = img.width;
        canvas.height = img.height;

        if (!ctx) {
          reject(new Error('Failed to get canvas context'));
          return;
        }

        // Draw original image
        ctx.drawImage(img, 0, 0);

        // Get image data
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;

        // Simple preprocessing: increase contrast and convert to grayscale
        for (let i = 0; i < data.length; i += 4) {
          // Convert to grayscale
          const gray = Math.round(0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]);

          // Increase contrast
          const contrast = 1.5;
          const factor = (259 * (contrast + 255)) / (255 * (259 - contrast));
          const newGray = Math.min(255, Math.max(0, factor * (gray - 128) + 128));

          data[i] = newGray;     // Red
          data[i + 1] = newGray; // Green
          data[i + 2] = newGray; // Blue
          // Alpha channel (i + 3) remains unchanged
        }

        // Put processed image data back
        ctx.putImageData(imageData, 0, 0);

        // Convert canvas to blob
        canvas.toBlob((blob) => {
          if (blob) {
            const processedFile = new File([blob], imageFile.name, {
              type: 'image/png',
              lastModified: Date.now(),
            });
            resolve(processedFile);
          } else {
            reject(new Error('Failed to create processed image blob'));
          }
        }, 'image/png');

      } catch (error) {
        reject(error);
      }
    };

    img.onerror = () => {
      reject(new Error('Failed to load image'));
    };

    // Load the image
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) {
        img.src = e.target.result as string;
      }
    };
    reader.onerror = () => {
      reject(new Error('Failed to read image file'));
    };
    reader.readAsDataURL(imageFile);
  });
};

/**
 * Extract text from multiple images in parallel
 */
export const extractTextFromMultipleImages = async (
  files: File[],
  options: OCROptions = {}
): Promise<Array<{ file: File; text: string; error?: string }>> => {
  const results = await Promise.allSettled(
    files.map(async (file) => {
      try {
        const text = await extractTextFromImage(file, options);
        return { file, text };
      } catch (error) {
        return {
          file,
          text: '',
          error: error instanceof Error ? error.message : 'Unknown error',
        };
      }
    })
  );

  return results.map((result, index) => {
    if (result.status === 'fulfilled') {
      return result.value;
    } else {
      return {
        file: files[index],
        text: '',
        error: result.reason instanceof Error ? result.reason.message : 'Processing failed',
      };
    }
  });
};