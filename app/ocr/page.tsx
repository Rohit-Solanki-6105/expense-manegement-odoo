// OCRPage.tsx (Updated to use lib.ts)

"use client";

import React, { useState } from "react";
// Import the core logic from lib.ts
import { callGeminiDataExtraction, extractTextFromResult } from "@/lib/gemini"; 

const OCRPage: React.FC = () => {
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [ocrResult, setOcrResult] = useState<any>(null);
  const [error, setError] = useState<string>("");

  // Read API key from environment variable
  const GEMINI_API_KEY = process.env.NEXT_PUBLIC_GEMINI_API_KEY || "";

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setImageFile(e.target.files[0]);
      setOcrResult(null);
      setError("");
    }
  };

  const handleUploadClick = async () => {
    if (!imageFile) {
      setError("Please select an image file first.");
      return;
    }

    if (!GEMINI_API_KEY) {
      setError("API key not configured in environment variables.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      // Use the imported function
      const json = await callGeminiDataExtraction(imageFile, GEMINI_API_KEY);
      console.log("Gemini API Response:", json);
      setOcrResult(json);
    } catch (e: any) {
      console.error("API Call Error:", e.message || e);
      setError(e.message || "Unknown error");
    } finally {
      setLoading(false);
    }
  };
  
  // Use the utility function to easily get the extracted text/JSON
  const extractedText = extractTextFromResult(ocrResult);

  return (
    <div style={{ padding: "2rem", fontFamily: "Arial, sans-serif" }}>
      <h1>Gemini AI Data Extraction & OCR</h1>
      
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
          {loading ? "Processing..." : "Upload and Extract Data"}
        </button>
      </div>

      {error && <p style={{ color: "red" }}>Error: {error}</p>}
      
      {/* Extracted Text/JSON Result */}
      {extractedText && (
        <div style={{ marginTop: "2rem" }}>
          <h3>Extracted Data (Expected JSON):</h3>
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