import { NextResponse } from "next/server";
import { z } from "zod";
import { SESSION_HEADER } from "./constants";

export const sessionSchema = z
  .string()
  .min(8, "Session identifier is too short.")
  .max(80, "Session identifier is too long.")
  .regex(/^[A-Za-z0-9._:-]+$/, "Session identifier contains invalid characters.");

export function getSessionId(request: Request): string | null {
  const raw = request.headers.get(SESSION_HEADER);
  const parsed = sessionSchema.safeParse(raw);
  return parsed.success ? parsed.data : null;
}

export const messageSchema = z.object({
  text: z
    .string({ required_error: "Paste the message you want to analyse." })
    .trim()
    .min(10, "Paste at least 10 characters so there is something to analyse.")
    .max(10000, "That message is too long. Keep it under 10,000 characters."),
});

export const emailSchema = z.object({
  fromName: z.string().trim().max(120, "Sender name is too long.").optional(),
  fromEmail: z
    .string({ required_error: "Enter the sender's email address." })
    .trim()
    .min(3, "Enter the sender's email address.")
    .max(200, "Sender email is too long.")
    .email("Enter a valid sender email address."),
  replyTo: z
    .string()
    .trim()
    .max(200)
    .optional()
    .transform((value) => (value ? value : undefined))
    .refine((value) => value === undefined || z.string().email().safeParse(value).success, {
      message: "Reply-to must be a valid email address.",
    }),
  subject: z
    .string({ required_error: "Add the subject line." })
    .trim()
    .max(300, "Subject is too long.")
    .default(""),
  body: z
    .string({ required_error: "Paste the email body." })
    .trim()
    .min(10, "Paste the email body (at least 10 characters).")
    .max(20000, "That email body is too long."),
  /** Explicit consent to send the sender address to Have I Been Pwned. */
  checkBreach: z.boolean().optional().default(false),
});

export const urlSchema = z.object({
  url: z
    .string({ required_error: "Enter a URL to check." })
    .trim()
    .min(4, "Enter a URL to check.").max(2048, "That URL is too long."),
});

export const historyQuerySchema = z.object({
  level: z.enum(["Low", "Medium", "High", "Critical"]).optional(),
  type: z.enum(["message", "email", "url"]).optional(),
});

/** Session-scoped responses must never be stored by browsers or proxies. */
export const NO_STORE_HEADERS = { "Cache-Control": "private, no-store, max-age=0" } as const;

export function jsonError(message: string, status = 400, issues?: unknown) {
  return NextResponse.json(
    { error: message, ...(issues ? { issues } : {}) },
    { status, headers: NO_STORE_HEADERS }
  );
}

export function zodError(error: z.ZodError) {
  const first = error.issues[0];
  return jsonError(first?.message ?? "Invalid input.", 422, error.flatten().fieldErrors);
}
