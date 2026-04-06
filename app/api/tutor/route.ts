import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { query, studentName, conceptName } = await req.json();

    if (!query || !studentName || !conceptName) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      // Fallback demo response if no API key
      return NextResponse.json({
        response: `Great question, ${studentName}! ${conceptName} is a fascinating topic in science. When light interacts with objects, it can pass through them, bounce off them, or be blocked completely. Think about how sunlight comes through your classroom window — that glass is transparent! Keep exploring and asking questions — that's how scientists think too!`,
      });
    }

    const systemPrompt = `You are a friendly, encouraging science tutor for a Class 6 CBSE student named ${studentName}. You are teaching the chapter "Light, Shadows and Reflections", specifically the concept: "${conceptName}".

Rules:
- Use simple language a 11-12 year old can understand
- Keep answers to 3-5 sentences maximum
- Use real-life examples from daily life in India
- If they ask a question, first give a small hint, then explain
- Be warm and encouraging, use their name sometimes
- Do NOT use markdown formatting, bullet points, or emojis in the response text
- Write in plain conversational English
- End with a brief encouraging line`;

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "llama3-8b-8192",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: query },
        ],
        max_tokens: 300,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      console.error("Groq API error:", err);
      return NextResponse.json({
        response: `Great question, ${studentName}! ${conceptName} is something we can explore together. The key idea is about how light behaves around us every day — from the shadows we see in the playground to the reflection in a mirror. Keep thinking and asking questions like this!`,
      });
    }

    const data = await response.json();
    const aiResponse = data.choices?.[0]?.message?.content || "I'm having trouble answering right now, but keep exploring!";

    return NextResponse.json({ response: aiResponse });
  } catch (error) {
    console.error("Tutor API error:", error);
    return NextResponse.json(
      { response: "I'm having a little trouble right now. Try asking me again in a moment!" },
      { status: 200 }
    );
  }
}
