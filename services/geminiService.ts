import { GoogleGenAI, Modality, Type } from "@google/genai";
import { Accent, FormattedTextResponse, VocabularyEntry, PronunciationFeedbackResponse, ReadingSpeed } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });

export async function getFormattedText(text: string): Promise<FormattedTextResponse> {
  const prompt = `You are Miss Emma, a friendly English teacher. Your goal is to help an ESL student.
  Analyze the following text and prepare it for the student.
  1. Reformat the text into easy-to-read paragraphs if needed.
  2. Identify key vocabulary words and wrap them in double asterisks, like this: **word**.
  3. Write a short, supportive comment for the student.
  Return ONLY a valid JSON object with the following structure: { "formattedText": "string", "supportiveComment": "string" }.
  
  Text to analyze:
  "${text}"`;

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
            formattedText: { type: Type.STRING },
            supportiveComment: { type: Type.STRING },
        },
        required: ["formattedText", "supportiveComment"]
      }
    }
  });

  try {
    return JSON.parse(response.text) as FormattedTextResponse;
  } catch(e) {
      console.error("Failed to parse getFormattedText response:", response.text, e);
      throw new Error("Received an invalid response from the AI.");
  }
}

export async function getVocabularyExplanations(text: string): Promise<VocabularyEntry[]> {
  const prompt = `You are Miss Emma, a friendly English teacher. Your goal is to help an ESL student.
  For the following text, identify up to 5 difficult vocabulary words for an A1-B2 level student. For each word, provide two things:
  1. A simple definition in Arabic.
  2. The International Phonetic Alphabet (IPA) transcription for the word.
  Return ONLY a valid JSON array with the following structure: [{ "word": "string", "definition": "string", "ipa": "string" }].
  
  Text to analyze:
  "${text}"`;

  const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
          responseMimeType: "application/json",
          responseSchema: {
              type: Type.ARRAY,
              items: {
                  type: Type.OBJECT,
                  properties: {
                      word: { type: Type.STRING },
                      definition: { type: Type.STRING },
                      ipa: { type: Type.STRING }
                  },
                  required: ["word", "definition", "ipa"]
              }
          }
      }
  });
  
  try {
    return JSON.parse(response.text) as VocabularyEntry[];
  } catch(e) {
      console.error("Failed to parse getVocabularyExplanations response:", response.text, e);
      throw new Error("Received an invalid response from the AI.");
  }
}

export async function getPronunciationGuide(word: string): Promise<{ ipa: string }> {
  const prompt = `You are a linguistic expert. Provide the International Phonetic Alphabet (IPA) transcription for the following English word.
  Return ONLY a valid JSON object with the structure: { "ipa": "string" }. If the word is nonsensical or not in English, return an empty string for the IPA.

  Word: "${word}"`;

  const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
          responseMimeType: "application/json",
          responseSchema: {
              type: Type.OBJECT,
              properties: {
                  ipa: { type: Type.STRING }
              },
              required: ["ipa"]
          }
      }
  });

  try {
    return JSON.parse(response.text) as { ipa: string };
  } catch(e) {
    console.error("Failed to parse getPronunciationGuide response:", response.text, e);
    throw new Error("Received an invalid response from the AI.");
  }
}

export async function getPronunciationFeedback(originalText: string, userAudio: { mimeType: string; data: string }, accent: Accent): Promise<PronunciationFeedbackResponse> {
    const prompt = `You are Miss Emma, a friendly and encouraging English teacher for ESL students.
    A student has recorded themselves reading the following text. Your task is to analyze their pronunciation from the provided audio and provide structured feedback.

    Original Text:
    "${originalText}"

    Instructions:
    1. Listen carefully to the student's audio.
    2. Compare their pronunciation to a standard ${accent} accent.
    3. Provide an overall accuracy score from 0 to 100, where 100 is perfect pronunciation. This must be a numerical value.
    4. Write a single, short, positive, and encouraging overall feedback sentence.
    5. Identify up to 3 words they had the most trouble with. If their pronunciation is excellent, the 'corrections' array should be empty.
    6. For each of these challenging words, provide a simple, actionable tip for improvement (e.g., "For 'three', make sure your tongue touches your top teeth for the 'th' sound.").
    7. If the audio is unclear, too quiet, or doesn't seem to contain the text, politely explain this in the 'overallFeedback' field, provide a low accuracy score (e.g., below 20), and leave the 'corrections' array empty.
    8. Return ONLY a valid JSON object with the following structure: { "accuracyScore": number, "overallFeedback": "string", "corrections": [{ "word": "string", "correctionTip": "string" }] }.
    `;

    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: {
            parts: [
                { text: prompt },
                { inlineData: userAudio }
            ]
        },
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    accuracyScore: { type: Type.NUMBER },
                    overallFeedback: { type: Type.STRING },
                    corrections: {
                        type: Type.ARRAY,
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                word: { type: Type.STRING },
                                correctionTip: { type: Type.STRING }
                            },
                            required: ["word", "correctionTip"]
                        }
                    }
                },
                required: ["accuracyScore", "overallFeedback", "corrections"]
            }
        }
    });

    try {
        return JSON.parse(response.text) as PronunciationFeedbackResponse;
    } catch(e) {
        console.error("Failed to parse getPronunciationFeedback response:", response.text, e);
        throw new Error("Received an invalid response from the AI.");
    }
}


export async function generateAudio(text: string, accent: Accent, speed: ReadingSpeed): Promise<string> {
    const voiceName = accent === 'American' ? 'Kore' : 'Puck'; // Kore for American, Puck for British

    let promptText = text;
    if (speed === 'Slower') {
        promptText = `Read slowly: ${text}`;
    } else if (speed === 'Faster') {
        promptText = `Read quickly: ${text}`;
    }

    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-preview-tts",
        contents: [{ parts: [{ text: promptText }] }],
        config: {
            responseModalities: [Modality.AUDIO],
            speechConfig: {
                voiceConfig: {
                    prebuiltVoiceConfig: { voiceName: voiceName },
                },
            },
        },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!base64Audio) {
        console.error("Failed to generate audio. Full API Response:", JSON.stringify(response, null, 2));
        throw new Error("No audio data returned from API. The content may have been blocked or the prompt was invalid.");
    }

    return base64Audio;
}