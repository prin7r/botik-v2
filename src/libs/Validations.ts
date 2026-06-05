import * as z from 'zod';

export const SignupSchema = z.object({
  email: z.string().email().toLowerCase().trim(),
  password: z.string().min(8, 'At least 8 characters').max(200),
});

export const LoginSchema = SignupSchema;

export const OpenRouterKeySchema = z.object({
  key: z
    .string()
    .min(20, 'OpenRouter keys start with sk-or-v1- and are at least 20 chars')
    .max(400)
    .regex(/^sk-or-(v1-)?[A-Za-z0-9_-]+$/, 'Must look like an OpenRouter key (sk-or-...)'),
});

export const TelegramTokenSchema = z.object({
  token: z
    .string()
    .regex(/^\d{8,12}:[A-Za-z0-9_-]{30,60}$/, 'Must look like a Telegram bot token (123456:ABC...)'),
});

export const CustomMcpSchema = z.object({
  name: z.string().min(1).max(40).regex(/^[a-z0-9-]+$/, 'lowercase letters, digits, dashes'),
  url: z.string().url(),
  transport: z.enum(['sse', 'http']).default('sse'),
});

export type SignupInput = z.infer<typeof SignupSchema>;
export type OpenRouterKeyInput = z.infer<typeof OpenRouterKeySchema>;
export type TelegramTokenInput = z.infer<typeof TelegramTokenSchema>;
export type CustomMcpInput = z.infer<typeof CustomMcpSchema>;
