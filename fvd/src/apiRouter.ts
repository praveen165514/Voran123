import { Router, json } from "express";
import { GoogleGenAI, Type } from "@google/genai";

const router = Router();
router.use(json({ limit: '50mb' }));

router.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

router.post("/extract-questions", async (req, res) => {
  try {
    if (!req.body.pdf) {
      return res.status(400).json({ error: "No PDF file uploaded" });
    }
    
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: "Gemini API Key is not configured." });
    }

    const ai = new GoogleGenAI({ 
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });

    const base64Data = req.body.pdf;
    
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash", // Using flash model as default to avoid quota limits
      contents: [
        {
          inlineData: {
            data: base64Data,
            mimeType: "application/pdf"
          }
        },
        {
          text: "Extract all the multiple-choice questions from this PDF. For each question, extract the question text, exactly 4 options (A, B, C, D), and the correct answer index (0 for A, 1 for B, 2 for C, 3 for D). Determine the AI confidence level for each extracted question."
        }
      ],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              text: { type: Type.STRING, description: "The text of the question" },
              options: { 
                type: Type.ARRAY, 
                items: { type: Type.STRING },
                description: "Exactly 4 options for the multiple-choice question." 
              },
              correctAnswerIndex: { type: Type.INTEGER, description: "Index of the correct answer (0, 1, 2, or 3)" },
              confidenceScore: { type: Type.NUMBER, description: "AI confidence score from 0 to 1 on how accurately it extracted the question and options, and identified the correct answer." },
              confidenceReason: { type: Type.STRING, description: "Why the AI gave this confidence score, especially if it's low or needs review." }
            },
            required: ["text", "options", "correctAnswerIndex", "confidenceScore"]
          }
        }
      }
    });

    const extractedText = response.text;
    const questions = JSON.parse(extractedText || "[]");
    
    res.json({ questions });

  } catch (err) {
    console.error("Extraction error:", err);
    res.status(500).json({ error: "Failed to process the PDF. Please try again." });
  }
});

export default router;
