// lib.ts

// The prompt specifies structured JSON output:
const OCR_JSON_PROMPT = `
Extract all relevant data from the image into a JSON object. 
The JSON must contain the following fields: 
"CustomerName", "HotelName", "TotalBill", "Date", and "Description".
For "Description", create a simple and short summary based on the data.
Also add country code for the currency print, before showing TotalBill.
Please ensure the response contains ONLY the valid JSON object, without any surrounding text or markdown.
`;

/**
 * Converts a File object into a Base64 encoded string,
 * suitable for the Gemini API's inlineData part.
 * @param file The image file to convert.
 * @returns A promise that resolves to the Base64 string of the file data (excluding the prefix).
 */
export const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      // The result is 'data:image/jpeg;base64,...', we only need the base64 part
      const result = reader.result as string;
      const base64String = result.split(",")[1];
      resolve(base64String);
    };
    reader.onerror = (error) => reject(error);
  });
};

/**
 * Calls the Gemini API's generateContent endpoint to perform structured data extraction (OCR) on an image.
 * This function is configured to request a JSON response based on the prompt.
 * * @param file The image file to process.
 * @param apiKey Your Gemini API key.
 * @returns A promise that resolves to the raw JSON response from the API.
 */
export const callGeminiDataExtraction = async (
  file: File,
  apiKey: string
): Promise<any> => {
  if (!apiKey) {
    throw new Error("API key not configured.");
  }

  // --- Configuration ---
  const MODEL_NAME = "gemini-2.5-flash"; // Excellent for speed and multimodal tasks
  const GEMINI_ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL_NAME}:generateContent?key=${apiKey}`;
  // ---------------------

  // Convert the image file to a base64 string
  const base64Image = await fileToBase64(file);
  const mimeType = file.type;

  // Construct the request body for the generateContent endpoint
  const requestBody = {
    contents: [
      {
        parts: [
          { text: OCR_JSON_PROMPT }, // Use the prompt defined above
          {
            inlineData: {
              data: base64Image,
              mimeType: mimeType,
            },
          },
        ],
      },
    ],
    // Optional: Use responseSchema or responseMimeType for stricter JSON output
    // For simplicity with gemini-2.5-flash, we rely on the prompt's instruction.
  };

  const response = await fetch(GEMINI_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    // Attempt to parse error details if available
    const errorJson = await response.json().catch(() => null);
    throw new Error(
      `API error: ${response.status} ${response.statusText}. Details: ${
        errorJson?.error?.message || "No further details."
      }`
    );
  }

  const json = await response.json();
  return json;
};

/**
 * A utility function to extract the text content (which should be JSON) 
 * from the complex Gemini API response.
 * @param ocrResult The raw JSON response from the callGeminiDataExtraction function.
 * @returns The extracted text string (expected to be JSON), or null if not found.
 */
export const extractTextFromResult = (ocrResult: any): string | null => {
  return ocrResult?.candidates?.[0]?.content?.parts?.[0]?.text || null;
};