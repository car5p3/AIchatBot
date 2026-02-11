import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";

// Configure Nodemailer transporter
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || "smtp.gmail.com",
  port: parseInt(process.env.EMAIL_PORT || "587"),
  secure: process.env.EMAIL_SECURE === "true",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

export async function POST(request: NextRequest) {
  try {
    const { requirements, projectName } = await request.json();

    if (!requirements) {
      return NextResponse.json(
        { error: "Requirements not provided" },
        { status: 400 },
      );
    }

    // Check if email credentials are configured
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
      console.error("Email credentials not configured");
      // Don't fail silently - log this but continue
      console.warn("Email sending skipped: EMAIL_USER or EMAIL_PASSWORD not configured");
      return NextResponse.json({ success: true, message: "Email credentials not configured, but proceeding" });
    }

    // Format the requirements for email body
    const emailBody = `
Hello,

A new project has been submitted through the Chat AI Assistant.

Project Name: ${projectName || "Not specified"}

Collected Requirements:
${typeof requirements === "string" ? requirements : JSON.stringify(requirements, null, 2)}

---
This is an automated email from the Chat AI Assistant.
Please log in to the admin panel to review and respond to this project inquiry.
    `.trim();

    // Send email
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: "abdulrehmanvaqar@gmail.com",
      subject: "New Project Requirements",
      text: emailBody,
      html: `
        <div style="font-family: Arial, sans-serif; color: #333;">
          <h2 style="color: #0066cc;">New Project Inquiry</h2>
          <p><strong>Project Name:</strong> ${projectName || "Not specified"}</p>
          <h3>Collected Requirements:</h3>
          <pre style="background-color: #f4f4f4; padding: 15px; border-radius: 5px; overflow-x: auto;">
${typeof requirements === "string" ? requirements : JSON.stringify(requirements, null, 2)}
          </pre>
          <hr style="margin: 20px 0; border: none; border-top: 1px solid #ddd;" />
          <p><em>This is an automated email from the Chat AI Assistant.</em></p>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);

    console.log("Email sent successfully to abdulrehmanvaqar@gmail.com");
    return NextResponse.json({ success: true, message: "Email sent successfully" });
  } catch (error) {
    console.error("Email sending error:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Failed to send email";
    
    // Log but don't fail the entire flow
    console.error("Email error details:", errorMessage);
    
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}
