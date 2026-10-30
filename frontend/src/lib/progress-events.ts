export const PROGRESS_UPDATED_EVENT = 'sabilearn:progress-updated';

export function emitProgressUpdated(): void {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event(PROGRESS_UPDATED_EVENT));
  }
}
