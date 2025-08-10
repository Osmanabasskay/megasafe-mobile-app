import { z } from 'zod';
import { createTRPCRouter, publicProcedure } from '../../create-context';
import db from '@/../backend/db/json-db';

const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID ?? '';
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN ?? '';
const TWILIO_VERIFY_SERVICE_SID = process.env.TWILIO_VERIFY_SERVICE_SID ?? '';

async function twilioVerifyCheck(phoneNumber: string, code: string) {
  if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !TWILIO_VERIFY_SERVICE_SID) {
    throw new Error('Twilio env not configured');
  }
  const url = `https://verify.twilio.com/v2/Services/${TWILIO_VERIFY_SERVICE_SID}/VerificationCheck`;
  const auth = Buffer.from(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`).toString('base64');
  const body = new URLSearchParams({ To: phoneNumber, Code: code });
  const res = await fetch(url, {
    method: 'POST',
    headers: { Authorization: `Basic ${auth}`, 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });
  const json = (await res.json()) as Record<string, unknown>;
  if (!res.ok) {
    console.error('[users.twilioVerifyCheck] error', res.status, json);
    throw new Error('OTP verification failed');
  }
  const status = (json.status as string) ?? 'pending';
  return status === 'approved';
}

export const usersRouter = createTRPCRouter({
  registerAfterOtp: publicProcedure
    .input(
      z.object({
        phoneNumber: z.string().min(6).max(32),
        code: z.string().min(3).max(10),
        userData: z.record(z.any()).default({}),
      })
    )
    .mutation(async ({ input }) => {
      console.log('[users.registerAfterOtp] start', input.phoneNumber);
      const approved = await twilioVerifyCheck(input.phoneNumber, input.code);
      if (!approved) {
        return { ok: false as const, error: 'OTP not valid' };
      }
      const existingList = await db.list('users', { where: { phone: input.phoneNumber } });
      if (existingList.items.length > 0) {
        return { ok: true as const, user: existingList.items[0] };
      }
      const user = await db.create('users', { phone: input.phoneNumber, ...input.userData });
      return { ok: true as const, user };
    }),
});

export type UsersRouter = typeof usersRouter;
