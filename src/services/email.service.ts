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

export async function sendEmail(options: EmailOptions, html: string) {
  try {
    const mailOptions = {
      from: emailConfig.from,
      to: options.to,
      subject: options.subject,
      html,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("Message sent: %s", info.messageId);
    return info;
  } catch (error) {
    console.error("Error sending email:", error);
    throw new Error("Failed to send email");
  }
}
