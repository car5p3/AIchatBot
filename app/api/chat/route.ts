import { NextRequest, NextResponse } from "next/server";

// Helper function to format requirements from chat
function formatRequirementsFromChat(messages: any[]): string {
  const userMessages = messages
    .filter((msg: any) => msg.sender === "user")
    .map((msg: any) => msg.text)
    .join("\n\n");
  
  return `Collected Requirements from Chat Conversation:\n\n${userMessages}`;
}

// Helper function to send email with requirements
async function sendRequirementsEmail(requirements: string, projectName: string): Promise<void> {
  try {
    const response = await fetch("http://localhost:3000/api/send-email", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        requirements,
        projectName,
      }),
    });

    if (!response.ok) {
      console.error("Failed to send email, status:", response.status);
      const errorData = await response.json();
      console.error("Email error:", errorData);
    } else {
      console.log("Email sent successfully");
    }
  } catch (error) {
    console.error("Error calling email API:", error);
  }
}

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
      console.error("OPENROUTER_API_KEY not configured");
      return NextResponse.json(
        { 
          error: "OpenRouter API key not configured. Please set OPENROUTER_API_KEY in your .env.local file.",
          suggestion: "Visit https://openrouter.ai/keys to create an API key"
        },
        { status: 500 },
      );
    }

    console.log("API Key is set (length:", apiKey.length, ")");
    console.log("API Key format valid:", apiKey.startsWith("sk-") ? "Yes" : "Check format");

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

IMPORTANT: When the user confirms they want to proceed (e.g., by saying "yes", "proceed", "go ahead", "let's do it", etc.):
- Respond EXACTLY with: "Great! I'll start working on your project now."
- Then on the next line, include this special marker: [CONFIRMED_PROCEED]

Keep the conversation professional, concise, and helpful; ask only one question at a time and wait for the user's
answer before asking the next follow-up.`;

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
      model: "gpt-4o-mini",  // Using GPT-4o mini as fallback (more reliable)
      messages: formattedMessages,
      max_tokens: 500,
      temperature: 0.7,
    };

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

    console.log("OpenRouter response status:", response.status);

    if (!response.ok) {
      const text = await response.text();
      console.error("OpenRouter error response:", text);
      console.error("OpenRouter response status:", response.status);
      console.error("OpenRouter response headers:", {
        contentType: response.headers.get('content-type'),
      });
      try {
        const error = JSON.parse(text);
        const errorMessage = error.error?.message || error.message || "OpenRouter API error";
        console.error("Parsed error:", errorMessage);
        
        // Provide helpful error messages based on status
        let userFriendlyError = errorMessage;
        if (response.status === 401) {
          userFriendlyError = "Authentication failed: Please check your API key is valid and has sufficient credits.";
        } else if (response.status === 429) {
          userFriendlyError = "Rate limited: Too many requests. Please wait a moment and try again.";
        } else if (response.status === 500 || response.status === 502 || response.status === 503) {
          userFriendlyError = "OpenRouter service is temporarily unavailable. Please try again later.";
        }
        
        return NextResponse.json(
          { error: userFriendlyError },
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
    let aiMessage = data.choices[0]?.message?.content;

    if (!aiMessage) {
      console.error("Empty response from OpenRouter:", data);
      return NextResponse.json(
        { error: "No response from OpenRouter" },
        { status: 500 },
      );
    }

    // Check if user confirmed to proceed
    const hasConfirmationMarker = aiMessage.includes("[CONFIRMED_PROCEED]");
    
    if (hasConfirmationMarker) {
      // Extract the visible message (without the marker)
      aiMessage = aiMessage.replace("[CONFIRMED_PROCEED]", "").trim();
      
      // Extract project name from the conversation
      const projectNameMatch = messages
        .find((msg: any) => msg.text.toLowerCase().includes("project") || msg.text.toLowerCase().includes("name"))
        ?.text || "Web Development Project";
      
      // Format collected requirements from the conversation
      const requirements = formatRequirementsFromChat(messages);
      
      // Send email in the background (don't await to keep response fast)
      sendRequirementsEmail(requirements, projectNameMatch).catch((err) => {
        console.error("Failed to send email:", err);
      });
      
      // Return response with navigation flag
      return NextResponse.json({ 
        message: aiMessage,
        shouldNavigate: true,
        navigateUrl: "https://www.bembexlab.com/",
      });
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
