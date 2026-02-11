import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { messages } = await request.json();

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: "Invalid request: messages array required" },
        { status: 400 },
      );
    }

    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "OpenRouter API key not configured" },
        { status: 500 },
      );
    }

    // System prompt guiding assistant behavior: greet, ask which service, gather full web development
    // project requirements and then ask whether to proceed with AI-assisted development.
    const systemPrompt = `You are a helpful, friendly assistant. At the start of a conversation you should:
1) Greet the user and ask which service they'd like (for example: "Web development").
2) If the user selects Web development, proceed to collect complete project requirements by asking
   clear, follow-up questions one at a time. Questions should include (but are not limited to):
   - Project name and purpose
   - Target audience and primary users
   - Key features and pages (e.g., authentication, dashboard, blog, e-commerce, admin)
   - Preferred technologies or tech stack (frontend, backend, database)
   - Integrations required (APIs, payment gateways, third-party services)
   - Authentication/authorization requirements and user roles
   - Design expectations (brand, responsive, accessibility)
   - Content and assets availability (text, images, logos)
   - Hosting, deployment, and runtime constraints
   - Timeline and budget constraints
3) Confirm each requirement before moving on. After you have collected the complete set of requirements,
   explicitly ask: "Would you like me to proceed with AI-assisted development of this project based on the
   requirements you've provided?" Do NOT start implementing or producing code until the user confirms.
Keep the conversation professional, concise, and helpful; ask only one question at a time and wait for the user's
answer before asking the next follow-up.

after collecting requirements, ask the user if he wants to proceed with AI-assisted development of the project based on the requirements provided.

if the user confirms, respond with "Great! I'll start working on your project now." and navigate the user to https://www.bembexlab.com/ in new tab and send the collected requirements as an email to abdulrehmanvaqar@gmail.com with the subject "New Project Requirements" and the body containing the collected requirements in a clear, organized format.

`;

    // Format messages for OpenRouter API, prepend the system prompt so the assistant follows the flow above
    const formattedMessages = [
      { role: "system", content: systemPrompt },
      ...messages.map((msg: { sender: string; text: string }) => ({
        role: msg.sender === "user" ? "user" : "assistant",
        content: msg.text,
      })),
    ];

    // Call OpenRouter API
    const requestBody = {
      model: "mistralai/mistral-7b-instruct",
      messages: formattedMessages,
      max_tokens: 500,
      temperature: 0.7,
    };

    console.log(
      "Calling OpenRouter with API key:",
      apiKey.substring(0, 20) + "...",
    );
    console.log("Request body:", JSON.stringify(requestBody, null, 2));

    const response = await fetch(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
          "HTTP-Referer": "https://chat-app.example.com",
          "X-Title": "Chat AI Assistant",
        },
        body: JSON.stringify(requestBody),
      },
    );

    if (!response.ok) {
      const text = await response.text();
      console.error("OpenRouter error response:", text);
      try {
        const error = JSON.parse(text);
        return NextResponse.json(
          { error: error.error?.message || "OpenRouter API error" },
          { status: response.status },
        );
      } catch {
        return NextResponse.json(
          { error: `OpenRouter API error: ${text}` },
          { status: response.status },
        );
      }
    }

    const data = await response.json();
    const aiMessage = data.choices[0]?.message?.content;

    if (!aiMessage) {
      console.error("Empty response from OpenRouter:", data);
      return NextResponse.json(
        { error: "No response from OpenRouter" },
        { status: 500 },
      );
    }

    return NextResponse.json({ message: aiMessage });
  } catch (error) {
    console.error("Chat API error:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Internal server error";
    console.error("Full error details:", {
      message: errorMessage,
      name: error instanceof Error ? error.name : "Unknown",
      stack: error instanceof Error ? error.stack : "No stack",
    });
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
