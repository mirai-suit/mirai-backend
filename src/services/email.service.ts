import { getEmailConfig } from "src/config/email/email";
import nodemailer from "nodemailer";

const emailConfig = getEmailConfig();

const transporter = nodemailer.createTransport({
  service: emailConfig.service,
  host: emailConfig.host,
  port: emailConfig.port,
  secure: emailConfig.secure,
  auth: {
    user: emailConfig.auth.user,
    pass: emailConfig.auth.pass,
  },
});

interface EmailOptions {
  to: string;
  subject: string;
}

interface EmailContent {
  html?: string;
  text?: string;
}

export async function sendEmail(
  options: EmailOptions,
  content: string | EmailContent
) {
  try {
    let mailOptions: any = {
      from: emailConfig.from,
      to: options.to,
      subject: options.subject,
    };

    // Handle both old string format and new object format
    if (typeof content === "string") {
      mailOptions.html = content;
    } else {
      if (content.html) mailOptions.html = content.html;
      if (content.text) mailOptions.text = content.text;
    }

    const info = await transporter.sendMail(mailOptions);
    console.log("Message sent: %s", info.messageId);
    return info;
  } catch (error) {
    console.error("Error sending email:", error);
    throw new Error("Failed to send email");
  }
}
