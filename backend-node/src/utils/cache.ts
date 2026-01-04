/**
 * Simple LRU Cache implementation
 * No external dependencies
 */
export class LRUCache<K, V> {
    private cache = new Map<K, V>();
    private readonly maxSize: number;

    constructor(maxSize: number = 100) {
        this.maxSize = maxSize;
    }

    get(key: K): V | undefined {
        if (!this.cache.has(key)) {
            return undefined;
        }
        // Move to end (most recently used)
        const value = this.cache.get(key)!;
        this.cache.delete(key);
        this.cache.set(key, value);
        return value;
    }

    set(key: K, value: V): void {
        // If key exists, delete to refresh position
        if (this.cache.has(key)) {
            this.cache.delete(key);
        } else if (this.cache.size >= this.maxSize) {
            // Remove oldest (first entry)
            const firstKey = this.cache.keys().next().value;
            if (firstKey !== undefined) {
                this.cache.delete(firstKey);
            }
        }
        this.cache.set(key, value);
    }

    has(key: K): boolean {
        return this.cache.has(key);
    }

    get size(): number {
        return this.cache.size;
    }

    clear(): void {
        this.cache.clear();
    }
}
