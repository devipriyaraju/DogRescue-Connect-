import { GoogleGenAI, Type } from "@google/genai";

// Initialize Gemini client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// Helper to strip base64 header
const stripBase64 = (base64: string) => {
    return base64.replace(/^data:(image|video)\/\w+;base64,/, "");
};

export const analyzeIncidentMedia = async (base64Data: string, mimeType: string = "image/jpeg") => {
  try {
    const rawData = stripBase64(base64Data);

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: mimeType,
              data: rawData
            }
          },
          {
            text: "Analyze this media (image or video). 1. Is it a dog or animal? 2. If yes, estimate severity of injury (1-10) where 10 is critical. 3. Give a short 1-sentence description. 4. Suggest immediate first aid or action. 5. Provide a list of 1-3 tags categorizing the condition (e.g., 'Injury', 'Abuse', 'Sick', 'Skin Infection', 'Starvation')."
          }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            isDog: { type: Type.BOOLEAN },
            severityScore: { type: Type.INTEGER },
            severityLabel: { type: Type.STRING, description: "Low, Medium, High, or Critical" },
            description: { type: Type.STRING },
            suggestedAction: { type: Type.STRING },
            tags: { 
              type: Type.ARRAY, 
              items: { type: Type.STRING },
              description: "Categorization tags like Abuse, Injury, Sick, etc."
            }
          },
          required: ["isDog", "severityScore", "severityLabel", "description", "suggestedAction", "tags"]
        }
      }
    });

    if (response.text) {
      return JSON.parse(response.text);
    }
    throw new Error("No response text from Gemini");

  } catch (error) {
    console.error("Gemini analysis failed:", error);
    return {
      isDog: true,
      severityScore: 0,
      severityLabel: "Unknown",
      description: "Could not analyze media.",
      suggestedAction: "Contact a vet immediately.",
      tags: ["Unknown"]
    };
  }
};

export const analyzeMediaForAbuse = async (base64Media: string, isVideo: boolean) => {
    try {
        const base64Data = stripBase64(base64Media);
        const mimeType = isVideo ? "video/mp4" : "image/jpeg";

        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: {
                parts: [
                    {
                        inlineData: {
                            mimeType: mimeType,
                            data: base64Data
                        }
                    },
                    {
                        text: "Analyze this media for animal abuse. 1. Is there evidence of abuse? 2. Is a human visible? 3. Describe the situation. 4. Rate severity."
                    }
                ]
            },
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        hasAbuse: { type: Type.BOOLEAN },
                        humanDetected: { type: Type.BOOLEAN },
                        severity: { type: Type.STRING, enum: ["LOW", "MEDIUM", "HIGH", "CRITICAL"] },
                        description: { type: Type.STRING }
                    },
                    required: ["hasAbuse", "humanDetected", "severity", "description"]
                }
            }
        });

        if (response.text) {
            return JSON.parse(response.text);
        }
        throw new Error("No response from Gemini");

    } catch (error) {
        console.error("Abuse analysis failed:", error);
        return {
            hasAbuse: true,
            humanDetected: true,
            severity: "HIGH",
            description: "Potential abuse detected (Simulation: AI Analysis Failed)"
        };
    }
};

export const performIdentityLookup = async () => {
    await new Promise(resolve => setTimeout(resolve, 2000));
    return {
        name: "Rahul Sharma",
        idNumber: "XXXX-XXXX-9821",
        address: "12/B, Sector 4, MG Road, Nearby Locality",
        confidenceScore: 0.98
    };
};