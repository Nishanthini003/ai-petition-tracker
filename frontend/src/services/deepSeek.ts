import axios from "axios";

const API_URL = "https://openrouter.ai/api/v1/chat/completions";
const API_KEY = "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";

export const getFromDeepseek = async (text: string) => {
  try {
    const response = await axios.post(
      API_URL,
      {
        model: "deepseek/deepseek-r1",
        messages: [
          {
            role: "user",
            content: `Analyze the following text and return only a valid JSON response formatted as { "title": "", "content": "", "category": " Title is what the content is based on, content is what they are conveying, and category is the category (water, sewage, electricity, etc.)" }.
              Input: ${text}`,
          },
        ],
      },
      {
        headers: {
          Authorization: `Bearer ${API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    const content = response.data.choices?.[0]?.message?.content;
    if (!content) throw new Error("Empty response from DeepSeek API.");

    // Extract JSON from response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("Invalid JSON format from DeepSeek API.");

    return JSON.parse(jsonMatch[0]);
  } catch (error: any) {
    console.error("Error in DeepSeek API:", error.response?.data || error.message);
    return null;
  }
};
