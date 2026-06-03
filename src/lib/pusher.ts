export function getPusherServer() { return null; }
export function getPusherClient() { return null; }
export function getEarthquakeChannel(earthquakeId: string) { return `earthquake-${earthquakeId}`; }

export const EARTHQUAKE_CHANNEL = 'earthquakes';

export const PUSHER_EVENTS = {
  NEW_COMMENT: 'new-comment',
  COMMENT_UPDATED: 'comment-updated',
  COMMENT_DELETED: 'comment-deleted',
  NEW_EARTHQUAKE: 'new-earthquake',
} as const;
