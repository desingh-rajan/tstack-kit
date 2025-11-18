import { z } from "zod";

/**
 * Email Settings Schema
 * Email/SMTP configuration (private - backend only)
 */
export const EmailSettingsSchema = z.object({
  smtp_host: z.string(),
  smtp_port: z.number().int().positive(),
  from_email: z.string().email(),
  from_name: z.string(),
});

export type EmailSettings = z.infer<typeof EmailSettingsSchema>;

export const DEFAULT_EMAIL_SETTINGS: EmailSettings = {
  smtp_host: "smtp.example.com",
  smtp_port: 587,
  from_email: "noreply@example.com",
  from_name: "My Application",
};
