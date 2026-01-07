/**
 * Keyword Extraction Utility for Hybrid Search
 * Extracts meaningful keywords from queries for metadata-based retrieval
 */

// Common stopwords to filter out
const STOPWORDS = new Set([
    'a', 'an', 'and', 'are', 'as', 'at', 'be', 'by', 'for', 'from',
    'has', 'have', 'he', 'in', 'is', 'it', 'its', 'of', 'on', 'or',
    'she', 'that', 'the', 'their', 'them', 'there', 'they', 'this',
    'to', 'was', 'were', 'what', 'when', 'where', 'which', 'who',
    'will', 'with', 'would', 'you', 'your', 'can', 'could', 'do',
    'does', 'did', 'had', 'how', 'if', 'may', 'me', 'my', 'no',
    'not', 'our', 'out', 'so', 'some', 'than', 'then', 'these',
    'those', 'up', 'very', 'we', 'why', 'about', 'after', 'all',
    'also', 'any', 'back', 'because', 'been', 'before', 'but',
    'each', 'even', 'get', 'give', 'go', 'here', 'into', 'just',
    'know', 'like', 'make', 'more', 'most', 'much', 'must', 'new',
    'now', 'only', 'other', 'over', 'own', 'same', 'see', 'should',
    'such', 'take', 'tell', 'through', 'under', 'use', 'want', 'way',
    'well', 'work', 'i', 'am', 'im', "i'm", 'please', 'thanks', 'thank',
    'hello', 'hi', 'hey', 'explain', 'describe', 'tell', 'show', 'me'
]);

// Domain-specific terms that should always be preserved (Cogneoverse specific)
const DOMAIN_TERMS = new Set([
    'cogneoverse', 'neo', 'orion', 'spline', 'rag', 'llm', 'embedding',
    'vector', 'pinecone', 'ai', 'ml', 'api', 'agent', 'cognition',
    'neural', 'transformer', 'architecture', 'system', 'internal',
    'documentation', 'docs', 'project', 'module', 'component', 'service'
]);

/**
 * Extract meaningful keywords from a query string
 * @param text - The input query text
 * @returns Array of extracted keywords (lowercased, deduplicated)
 */
export function extractKeywords(text: string): string[] {
    // Normalize: lowercase and remove punctuation except hyphens
    const normalized = text.toLowerCase().replace(/[^\w\s-]/g, ' ');

    // Tokenize by whitespace
    const tokens = normalized.split(/\s+/).filter(t => t.length > 0);

    const keywords: string[] = [];
    const seen = new Set<string>();

    for (const token of tokens) {
        // Skip very short tokens (< 2 chars) unless it's a domain term
        if (token.length < 2 && !DOMAIN_TERMS.has(token)) {
            continue;
        }

        // Always include domain terms
        if (DOMAIN_TERMS.has(token)) {
            if (!seen.has(token)) {
                keywords.push(token);
                seen.add(token);
            }
            continue;
        }

        // Skip stopwords
        if (STOPWORDS.has(token)) {
            continue;
        }

        // Skip if already seen
        if (seen.has(token)) {
            continue;
        }

        // Include remaining meaningful tokens (min length 3)
        if (token.length >= 3) {
            keywords.push(token);
            seen.add(token);
        }
    }

    return keywords;
}

/**
 * Calculate keyword match score between query keywords and text
 * @param keywords - Extracted keywords from query
 * @param text - Text to match against
 * @returns Score from 0 to 1 based on keyword overlap
 */
export function calculateKeywordScore(keywords: string[], text: string): number {
    if (keywords.length === 0) return 0;

    const textLower = text.toLowerCase();
    let matchCount = 0;
    let domainBoostCount = 0;

    for (const keyword of keywords) {
        if (textLower.includes(keyword)) {
            matchCount++;
            // Extra weight for domain terms
            if (DOMAIN_TERMS.has(keyword)) {
                domainBoostCount++;
            }
        }
    }

    // Base score: proportion of keywords found
    const baseScore = matchCount / keywords.length;

    // Domain boost: up to 20% extra for domain term matches
    const domainBoost = Math.min(0.2, (domainBoostCount / keywords.length) * 0.3);

    return Math.min(1, baseScore + domainBoost);
}

/**
 * Check if any keyword is present in the given text
 */
export function hasKeywordMatch(keywords: string[], text: string): boolean {
    const textLower = text.toLowerCase();
    return keywords.some(kw => textLower.includes(kw));
}
