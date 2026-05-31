/** Format date as readable string (e.g. "Mar 10, 2026") */
export const formatDate = (
    dateString: string | null | undefined,
    options?: Intl.DateTimeFormatOptions
): string => {
    if (!dateString || dateString === '' || dateString === '0000-00-00' || dateString === '0000-00-00 00:00:00') {
        return 'N/A';
    }

    try {
        const date = new Date(dateString);

        if (isNaN(date.getTime())) {
            return 'Invalid Date';
        }

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

/** Format date with time (e.g. "Mar 10, 2026, 2:30 PM") */
export const formatDateTime = (dateString: string | null | undefined): string => {
    return formatDate(dateString, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
};

/** Format as relative time (e.g. "2 days ago", "3 weeks ago") */
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
