export function sanitizeQuery(query: string): string {
    // Remove SQL wildcard characters and other potentially problematic characters
    return query.replace(/[%_\\]/g, '');
}