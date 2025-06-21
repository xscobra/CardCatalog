import axios from "axios";
import { z } from "zod";

const cardFaceSchema = z.object({
  image_uris: z.object({
    normal: z.string()
  }).optional()
});

const scryfallCardSchema = z.object({
  id: z.string(),
  name: z.string(),
  image_uris: z.object({
    normal: z.string()
  }).optional(),
  card_faces: z.array(cardFaceSchema).optional(),
  prices: z.object({
    usd: z.string().nullable(),
    usd_foil: z.string().nullable()
  }),
  set: z.string(),
  set_name: z.string(),
  collector_number: z.string(),
  set_type: z.string()
});

export type ScryfallCard = z.infer<typeof scryfallCardSchema>;

// Improved rate limit tracking with request queue
class RateLimiter {
  private queue: Array<() => Promise<void>> = [];
  private processing = false;
  private remaining = 1000;
  private reset = Date.now() + 60000;
  private lastRequest = Date.now();

  async execute<T>(request: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      this.queue.push(async () => {
        try {
          // Ensure minimum delay between requests
          const timeSinceLastRequest = Date.now() - this.lastRequest;
          if (timeSinceLastRequest < 100) {
            await new Promise(resolve => setTimeout(resolve, 100 - timeSinceLastRequest));
          }

          // Check rate limit
          if (this.remaining <= 5) {
            const timeUntilReset = this.reset - Date.now();
            if (timeUntilReset > 0) {
              await new Promise(resolve => setTimeout(resolve, timeUntilReset));
            }
          }

          const result = await request();
          resolve(result);
        } catch (error) {
          reject(error);
        }
      });

      if (!this.processing) {
        this.processQueue();
      }
    });
  }

  private async processQueue() {
    if (this.queue.length === 0) {
      this.processing = false;
      return;
    }

    this.processing = true;
    const request = this.queue.shift();
    if (request) {
      await request();
      this.lastRequest = Date.now();
      this.processQueue();
    }
  }

  updateLimits(headers: Record<string, string>) {
    const remaining = headers['x-ratelimit-remaining'];
    const reset = headers['x-ratelimit-reset'];

    if (remaining) this.remaining = parseInt(remaining, 10);
    if (reset) this.reset = parseInt(reset, 10) * 1000;
  }
}

// Enhanced rate limiter for Scryfall API compliance
class ScryfallRateLimiter {
  private queue: Array<() => Promise<void>> = [];
  private processing = false;
  private requestTimes: number[] = [];
  private readonly MAX_REQUESTS_PER_SECOND = 8; // Conservative limit (80% of Scryfall's 10/sec)
  private readonly MIN_DELAY_MS = 125; // 125ms minimum delay
  private lastRequestTime = 0;

  async execute<T>(request: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      this.queue.push(async () => {
        try {
          await this.waitForRateLimit();
          const result = await this.makeRequest(request);
          resolve(result);
        } catch (error) {
          // Handle 429 errors with exponential backoff
          if (error instanceof Error && error.message.includes('429')) {
            console.warn('Rate limit exceeded, implementing backoff');
            await new Promise(resolve => setTimeout(resolve, 5000)); // 5 second backoff
            try {
              await this.waitForRateLimit();
              const retryResult = await this.makeRequest(request);
              resolve(retryResult);
            } catch (retryError) {
              reject(retryError);
            }
          } else {
            reject(error);
          }
        }
      });

      this.processQueue();
    });
  }

  private async makeRequest<T>(request: () => Promise<T>): Promise<T> {
    this.recordRequestTime();
    return await request();
  }

  private recordRequestTime() {
    const now = Date.now();
    this.requestTimes.push(now);
    this.lastRequestTime = now;
    
    // Clean old request times (older than 1 second)
    this.requestTimes = this.requestTimes.filter(time => now - time < 1000);
  }

  private async waitForRateLimit(): Promise<void> {
    const now = Date.now();
    
    // Ensure minimum delay between requests
    const timeSinceLastRequest = now - this.lastRequestTime;
    if (timeSinceLastRequest < this.MIN_DELAY_MS) {
      await new Promise(resolve => 
        setTimeout(resolve, this.MIN_DELAY_MS - timeSinceLastRequest)
      );
    }

    // Clean old request times
    this.requestTimes = this.requestTimes.filter(time => now - time < 1000);

    // If we're at the limit, wait until we can make another request
    if (this.requestTimes.length >= this.MAX_REQUESTS_PER_SECOND) {
      const oldestRequest = this.requestTimes[0];
      const waitTime = 1000 - (now - oldestRequest) + 50; // Add 50ms buffer
      if (waitTime > 0) {
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    }
  }

  private async processQueue() {
    if (this.processing || this.queue.length === 0) return;

    this.processing = true;

    while (this.queue.length > 0) {
      const request = this.queue.shift();
      if (request) {
        await request();
      }
    }

    this.processing = false;
  }
}

const rateLimiter = new ScryfallRateLimiter();

// Create axios instance with enhanced error handling
const api = axios.create({
  baseURL: "https://api.scryfall.com",
  timeout: 10000,
});

// Add response interceptor for rate limit tracking
api.interceptors.response.use(
  (response) => {
    rateLimiter.updateLimits(response.headers as Record<string, string>);
    return response;
  },
  async (error) => {
    if (axios.isAxiosError(error)) {
      if (error.response?.status === 429) {
        const retryAfter = error.response.headers['retry-after'];
        if (retryAfter) {
          await new Promise(resolve => setTimeout(resolve, parseInt(retryAfter, 10) * 1000));
          return api.request(error.config);
        }
      }

      // Enhance error messages
      throw new Error(
        error.response?.data?.details ||
        error.response?.data?.message ||
        error.message
      );
    }
    throw error;
  }
);

export const searchCards = async (query: string) => {
  if (!query.trim()) return [];

  return rateLimiter.execute(async () => {
    const cleanQuery = query.trim().toLowerCase();
    
    // First try exact name search for better accuracy
    let searchQueries = [
      `!"${cleanQuery}"`, // Exact name match (highest priority)
      `name:"${cleanQuery}"`, // Name field exact match
      cleanQuery // Fallback to general search
    ];
    
    let allResults: any[] = [];
    
    // Try each search query in order of preference
    for (const searchQuery of searchQueries) {
      try {
        const encodedQuery = encodeURIComponent(searchQuery);
        const response = await fetch(`https://api.scryfall.com/cards/search?q=${encodedQuery}&order=name&unique=names`, {
          headers: {
            'User-Agent': 'MTG-Deck-Builder/1.0 (Replit Application)'
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          const results = data.data || [];
          
          if (results.length > 0) {
            allResults = results;
            break; // Stop at first successful search that returns results
          }
        }
      } catch (error) {
        // Continue to next search query if this one fails
        continue;
      }
    }
    
    if (allResults.length === 0) {
      return [];
    }

    // Parse and sort results for better accuracy
    const parsedResults = allResults.map((card: any) => scryfallCardSchema.parse(card));
    
    // Sort results by relevance to improve accuracy
    return parsedResults.sort((a, b) => {
      const aName = a.name.toLowerCase();
      const bName = b.name.toLowerCase();
      
      // Exact matches first
      if (aName === cleanQuery && bName !== cleanQuery) return -1;
      if (bName === cleanQuery && aName !== cleanQuery) return 1;
      
      // Names that start with the query
      const aStarts = aName.startsWith(cleanQuery);
      const bStarts = bName.startsWith(cleanQuery);
      if (aStarts && !bStarts) return -1;
      if (bStarts && !aStarts) return 1;
      
      // Shorter names are generally more relevant
      if (aStarts && bStarts) {
        return aName.length - bName.length;
      }
      
      // Default alphabetical sorting
      return aName.localeCompare(bName);
    });
  });
};

export const getCardPrints = async (cardName: string) => {
  return rateLimiter.execute(async () => {
    const encodedName = encodeURIComponent(cardName);
    const response = await fetch(`https://api.scryfall.com/cards/search?q=!"${encodedName}"&unique=prints&order=released`, {
      headers: {
        'User-Agent': 'MTG-Deck-Builder/1.0 (Replit Application)'
      }
    });
    
    if (!response.ok) {
      if (response.status === 404) return [];
      if (response.status === 429) {
        throw new Error('429: Rate limit exceeded');
      }
      throw new Error(`Failed to fetch prints: ${response.statusText}`);
    }

    const data = await response.json();
    return data.data?.map((card: any) => scryfallCardSchema.parse(card)) || [];
  });
};

export const getSetSymbolUrl = (setCode: string) => {
  return `https://svgs.scryfall.io/sets/${setCode}.svg`;
};

export const getCardImageUrl = (card: ScryfallCard): string => {
  if (card.image_uris?.normal) {
    return card.image_uris.normal;
  }

  if (card.card_faces?.[0]?.image_uris?.normal) {
    return card.card_faces[0].image_uris.normal;
  }

  return "";
};