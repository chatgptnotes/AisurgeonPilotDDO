/**
 * Zoom Link Validator Utility
 * Simplified to Zoom-only for clean implementation
 */

/**
 * Validates if a URL is a proper Zoom meeting link
 */
export function validateZoomLink(link: string): boolean {
  if (!link || !link.trim()) {
    return false;
  }

  try {
    const url = new URL(link);
    return url.hostname.includes('zoom.us') && /\/j\/\d+/.test(link);
  } catch {
    return false;
  }
}

/**
 * Extracts meeting ID from a Zoom link
 */
export function extractZoomMeetingId(link: string): string | null {
  if (!link || !link.trim()) {
    return null;
  }

  const match = link.match(/\/j\/(\d+)/);
  return match ? match[1] : null;
}

/**
 * Formats a Zoom link to ensure it has proper protocol
 */
export function formatZoomLink(link: string): string {
  if (!link || !link.trim()) {
    return '';
  }

  const trimmed = link.trim();

  // If it starts with zoom.us without protocol, add https://
  if (trimmed.startsWith('zoom.us')) {
    return 'https://' + trimmed;
  }

  // If it doesn't start with http:// or https://, add https://
  if (!/^https?:\/\//i.test(trimmed)) {
    return 'https://' + trimmed;
  }

  return trimmed;
}

/**
 * Gets validation error message for a Zoom link
 */
export function getZoomValidationError(link: string): string | null {
  if (!link || !link.trim()) {
    return 'Zoom meeting link is required';
  }

  try {
    const url = new URL(link);

    if (!url.hostname.includes('zoom.us')) {
      return 'Invalid Zoom link. Must be a zoom.us URL';
    }

    if (!/\/j\/\d+/.test(link)) {
      return 'Invalid Zoom link format. Example: https://zoom.us/j/1234567890';
    }

    return null;
  } catch {
    return 'Invalid URL format. Please enter a valid URL starting with https://';
  }
}

/**
 * Example Zoom link for display
 */
export const ZOOM_EXAMPLE = 'https://zoom.us/j/1234567890';
