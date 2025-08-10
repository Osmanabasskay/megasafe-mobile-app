import { z } from 'zod';
import { createTRPCRouter, publicProcedure } from '../../create-context';

const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID ?? '';
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN ?? '';
const TWILIO_VERIFY_SERVICE_SID = process.env.TWILIO_VERIFY_SERVICE_SID ?? '';

async function twilioRequest(path: string, body: URLSearchParams) {
  if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !TWILIO_VERIFY_SERVICE_SID) {
    throw new Error('Twilio env not configured: set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_VERIFY_SERVICE_SID');
  }

  const url = `https://verify.twilio.com/v2/Services/${TWILIO_VERIFY_SERVICE_SID}/${path}`;
  const auth = Buffer.from(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`).toString('base64');

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body,
  });

  const text = await res.text();
  let json: unknown;
  try {
    json = JSON.parse(text);
  } catch {
    json = { raw: text };
  }
  if (!res.ok) {
    console.error('Twilio error', res.status, text);
    throw new Error(`Twilio request failed: ${res.status}`);
  }
  return json as Record<string, unknown>;
}

export const verifyRouter = createTRPCRouter({
  sendOtp: publicProcedure
    .input(
      z.object({
        phoneNumber: z.string().min(6).max(32),
        channel: z.enum(['sms', 'call']).default('sms'),
      })
    )
    .mutation(async ({ input }) => {
      console.log('[verify.sendOtp] start', input.phoneNumber);
      const body = new URLSearchParams({ To: input.phoneNumber, Channel: input.channel });
      const data = await twilioRequest('Verifications', body);
      return {
        sid: (data.sid as string) ?? null,
        status: (data.status as string) ?? 'pending',
        to: (data.to as string) ?? input.phoneNumber,
      };
    }),

  checkOtp: publicProcedure
    .input(
      z.object({
        phoneNumber: z.string().min(6).max(32),
        code: z.string().min(3).max(10),
      })
    )
    .mutation(async ({ input }) => {
      console.log('[verify.checkOtp] start', input.phoneNumber);
      const body = new URLSearchParams({ To: input.phoneNumber, Code: input.code });
      const data = await twilioRequest('VerificationCheck', body);
      const status = (data.status as string) ?? 'pending';
      const approved = status === 'approved';
      return { approved, status };
    }),
});

export type VerifyRouter = typeof verifyRouter;
