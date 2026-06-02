import { normalizeSenderId } from './userId';

export function isSameChatMessageGroup<T extends { sentAt: string; senderId: number | null }>(
  previous: T | undefined,
  current: T,
): boolean {
  if (!previous) return false;
  const sameDay =
    new Date(previous.sentAt).toDateString() === new Date(current.sentAt).toDateString();
  const sameSender =
    normalizeSenderId(previous.senderId) === normalizeSenderId(current.senderId);
  return sameDay && sameSender;
}
