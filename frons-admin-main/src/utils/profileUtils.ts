/**
 * Get initials from a full name
 * @param name - The full name to extract initials from
 * @returns The initials (max 2 characters)
 */
export function getInitials(name: string): string {
  return name
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase())
    .slice(0, 2)
    .join("");
}

/**
 * Format a date string to display just the year
 * @param dateString - The date string to format
 * @returns The formatted year or the original string if parsing fails
 */
export function formatDate(dateString: string): string {
  if (!dateString) return "";
  try {
    return new Date(dateString).getFullYear().toString();
  } catch {
    return dateString;
  }
}

/**
 * Format an array of authors or a string of authors
 * @param authors - Authors as array or comma-separated string
 * @returns Formatted authors string
 */
export function formatAuthors(authors: string[] | string): string {
  if (Array.isArray(authors)) {
    return authors.join(", ");
  }
  return authors;
}

/**
 * Format ORCID URL
 * @param orcid - ORCID identifier
 * @returns Full ORCID URL
 */
export function formatOrcidUrl(orcid: string): string {
  return `https://orcid.org/${orcid}`;
}

/**
 * Format DOI URL
 * @param doi - DOI identifier
 * @returns Full DOI URL
 */
export function formatDoiUrl(doi: string): string {
  return `https://doi.org/${doi}`;
}