import { trpc } from './trpc';

export function useSendOtp() {
  const t = trpc;
  return t.verify.sendOtp.useMutation({
    onMutate: (vars) => {
      console.log('[useSendOtp] mutate', vars.phoneNumber);
    },
    onError: (err) => {
      console.error('[useSendOtp] error', err);
    },
    onSuccess: (data) => {
      console.log('[useSendOtp] success', data);
    },
  });
}

export function useCheckOtp() {
  const t = trpc;
  return t.verify.checkOtp.useMutation({
    onMutate: (vars) => {
      console.log('[useCheckOtp] mutate', vars.phoneNumber);
    },
    onError: (err) => {
      console.error('[useCheckOtp] error', err);
    },
    onSuccess: (data) => {
      console.log('[useCheckOtp] success', data);
    },
  });
}
