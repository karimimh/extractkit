// Helper function to convert relative image URLs to absolute URLs
export const getAbsoluteImageUrl = (relativeUrl: string): string => {
  // If it's already absolute, return as is
  if (relativeUrl.startsWith("http://") || relativeUrl.startsWith("https://")) {
    return relativeUrl;
  }

  // For development
  if (import.meta.env.DEV) {
    return `http://localhost:8000${relativeUrl}`;
  }

  // For production, check if we have a custom API URL
  if (import.meta.env.VITE_API_URL) {
    const baseUrl = import.meta.env.VITE_API_URL.replace("/api", "");
    return `${baseUrl}${relativeUrl}`;
  }

  // Default to current origin for production (same domain)
  return `${window.location.origin}${relativeUrl}`;
};
