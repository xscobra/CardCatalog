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

const rateLimiter = new RateLimiter();

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

// Wrap API calls with rate limiter
export const searchCards = async (query: string) => {
  return rateLimiter.execute(async () => {
    const response = await api.get(`/cards/search?q=${encodeURIComponent(query)}`);
    return z.array(scryfallCardSchema).parse(response.data.data);
  });
};

export const getCardPrints = async (cardName: string) => {
  return rateLimiter.execute(async () => {
    const response = await api.get(`/cards/search?q=!"${encodeURIComponent(cardName)}" unique:prints`);
    return z.array(scryfallCardSchema).parse(response.data.data);
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