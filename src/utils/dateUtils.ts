/**
 * Formats a date string into a readable format
 * @param dateString - The date string to format (can be null, undefined, or empty)
 * @param options - Intl.DateTimeFormatOptions for customizing the output
 * @returns Formatted date string or fallback text
 */
export const formatDate = (
    dateString: string | null | undefined,
    options?: Intl.DateTimeFormatOptions
): string => {
    // Handle null, undefined, or empty strings
    if (!dateString || dateString === '' || dateString === '0000-00-00' || dateString === '0000-00-00 00:00:00') {
        return 'N/A';
    }

    try {
        const date = new Date(dateString);

        // Check if the date is valid
        if (isNaN(date.getTime())) {
            return 'Invalid Date';
        }

        // Default options if none provided
        const defaultOptions: Intl.DateTimeFormatOptions = {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        };

        return date.toLocaleDateString('en-US', options || defaultOptions);
    } catch (error) {
        console.error('Error formatting date:', error);
        return 'Invalid Date';
    }
};

/**
 * Formats a date string into a full date-time format
 * @param dateString - The date string to format
 * @returns Formatted date-time string
 */
export const formatDateTime = (dateString: string | null | undefined): string => {
    return formatDate(dateString, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
};

/**
 * Formats a date string into a relative time format (e.g., "2 days ago")
 * @param dateString - The date string to format
 * @returns Relative time string
 */
export const formatRelativeTime = (dateString: string | null | undefined): string => {
    if (!dateString || dateString === '' || dateString === '0000-00-00' || dateString === '0000-00-00 00:00:00') {
        return 'N/A';
    }

    try {
        const date = new Date(dateString);

        if (isNaN(date.getTime())) {
            return 'Invalid Date';
        }

        const now = new Date();
        const diffInMs = now.getTime() - date.getTime();
        const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

        if (diffInDays === 0) return 'Today';
        if (diffInDays === 1) return 'Yesterday';
        if (diffInDays < 7) return `${diffInDays} days ago`;
        if (diffInDays < 30) return `${Math.floor(diffInDays / 7)} weeks ago`;
        if (diffInDays < 365) return `${Math.floor(diffInDays / 30)} months ago`;
        return `${Math.floor(diffInDays / 365)} years ago`;
    } catch (error) {
        console.error('Error formatting relative time:', error);
        return 'Invalid Date';
    }
};
