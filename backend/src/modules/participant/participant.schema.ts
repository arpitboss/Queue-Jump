import { z } from "zod";

export const joinWaitlistSchema = z.object({
  email: z.string().trim().email("Invalid email address"),
  referralCode: z.string().trim().optional().nullable(),
});

export type JoinWaitlistInput = z.infer<typeof joinWaitlistSchema>;