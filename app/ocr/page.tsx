"use client";

import React, { useState } from "react";

// Helper function to convert File to a base64 string
const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      // The result is 'data:image/jpeg;base64,...', we only need the base64 part
      const base64String = (reader.result as string).split(",")[1];
      resolve(base64String);
    };
    reader.onerror = (error) => reject(error);
  });
};

const OCRPage: React.FC = () => {
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [ocrResult, setOcrResult] = useState<any>(null);
  const [error, setError] = useState<string>("");

  // Read API key from environment variable
  // NOTE: Exposing API keys in client-side code (even via NEXT_PUBLIC) is INSECURE.
  // A secure solution is to use a Next.js API Route (backend) as a proxy.
  const GEMINI_API_KEY = process.env.NEXT_PUBLIC_GEMINI_API_KEY || "";

  // 1. Correct Gemini API Endpoint for multimodal tasks (like OCR)
  const MODEL_NAME = "gemini-2.5-flash"; // Excellent for speed and multimodal tasks
  const GEMINI_ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL_NAME}:generateContent?key=${GEMINI_API_KEY}`;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setImageFile(e.target.files[0]);
      setOcrResult(null);
      setError("");
    }
  };

  const callGeminiOCR = async (file: File) => {
    if (!GEMINI_API_KEY) {
      setError("API key not configured in environment variables.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      // 2. Convert the image file to a base64 string
      const base64Image = await fileToBase64(file);
      const mimeType = file.type;

      // 3. Construct the request body as required by the generateContent endpoint
      const requestBody = {
        contents: [
          {
            parts: [
              {
                // Prompt to instruct the model to perform OCR
                text: "Extract all data into different fields and create a json file including description (create by yourself simple and short according to the data.), Required Fields : Customer Name, Hotel Name, Total Bill, Date and Description.",
              },
              {
                // Image part with base64 data and MIME type
                inlineData: {
                  data: base64Image,
                  mimeType: mimeType,
                },
              },
            ],
          },
        ],
      };

      const response = await fetch(GEMINI_ENDPOINT, {
        method: "POST",
        headers: {
          // API key is passed in the URL, so we only need Content-Type header
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
      console.log("Gemini OCR API Response:", json);
      setOcrResult(json);
    } catch (e: any) {
      console.error("OCR API Call Error:", e.message || e);
      setError(e.message || "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  const handleUploadClick = () => {
    if (!imageFile) {
      setError("Please select an image file first.");
      return;
    }
    callGeminiOCR(imageFile);
  };
  
  // Extract the text from the result for better display
  const extractedText = ocrResult?.candidates?.[0]?.content?.parts?.[0]?.text;

  return (
    <div style={{ padding: "2rem", fontFamily: "Arial, sans-serif" }}>
      <h1>Gemini AI OCR Integration</h1>
      
      {/* File Input and Button */}
      <div style={{ marginBottom: "1.5rem" }}>
        <input type="file" accept="image/*" onChange={handleFileChange} />
        <button
          onClick={handleUploadClick}
          disabled={loading || !imageFile}
          style={{
            marginLeft: "1rem",
            padding: "0.5rem 1rem",
            cursor: loading || !imageFile ? "not-allowed" : "pointer",
            backgroundColor: loading ? "#ccc" : "#4CAF50",
            color: "white",
            border: "none",
            borderRadius: "4px",
          }}
        >
          {loading ? "Processing..." : "Upload and Extract Text"}
        </button>
      </div>

      {error && <p style={{ color: "red" }}>Error: {error}</p>}
      
      {/* Extracted Text Result */}
      {extractedText && (
        <div style={{ marginTop: "2rem" }}>
          <h3>Extracted Text:</h3>
          <pre
            style={{
              backgroundColor: "#f0f8ff",
              padding: "1rem",
              borderRadius: "5px",
              border: "1px solid #cceeff",
              whiteSpace: "pre-wrap",
              wordBreak: "break-word",
            }}
          >
            {extractedText}
          </pre>
        </div>
      )}

      {/* Raw API Response (Optional) */}
      {ocrResult && (
        <div style={{ marginTop: "2rem" }}>
          <h3>Raw Gemini API Response:</h3>
          <pre
            style={{
              backgroundColor: "#f3f3f3",
              padding: "1rem",
              borderRadius: "5px",
              maxHeight: "300px",
              overflowY: "auto",
            }}
          >
            {JSON.stringify(ocrResult, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
};

export default OCRPage;