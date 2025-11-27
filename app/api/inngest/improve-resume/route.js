import { GoogleGenerativeAI } from "@google/generative-ai";

const model = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
  .getGenerativeModel({ model: "gemini-2.0-flash" });

export async function POST(req) {
  try {
    const { current } = await req.json();
    const prompt = `
      Improve this resume summary professionally:
      "${current}"
      Make it concise, impact-driven, ATS friendly.
      Return ONLY the improved text.
    `;

    const result = await model.generateContent(prompt);
    const improved = result.response.text().trim();

    return Response.json({ success: true, improved });
  } catch (e) {
    return Response.json({ success: false, error: e.message });
  }
}
