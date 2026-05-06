const CHANNEL_NAME = 'admin_session_sync';

export type BroadcastMessage =
  | { type: 'SESSION_LOCK'; username: string }
  | { type: 'SESSION_UNLOCK'; username: string }
  | { type: 'LOGOUT' }
  | { type: 'DECOY_ACTIVE'; username: string };

let channel: BroadcastChannel | null = null;

function getChannel(): BroadcastChannel {
  if (!channel) {
    channel = new BroadcastChannel(CHANNEL_NAME);
  }
  return channel;
}

export function sendBroadcast(msg: BroadcastMessage) {
  getChannel().postMessage(msg);
}

export function listenBroadcasts(cb: (msg: BroadcastMessage) => void): () => void {
  const ch = getChannel();
  const handler = (event: MessageEvent) => {
    // Basic validation
    if (event.data && typeof event.data.type === 'string') {
      cb(event.data as BroadcastMessage);
    }
  };
  ch.addEventListener('message', handler);
  return () => {
    ch.removeEventListener('message', handler);
    // Don't close the channel – it might be reused
  };
}