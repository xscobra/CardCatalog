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

// Rate limit tracking
const rateLimitState = {
  remaining: 1000, // Scryfall default
  reset: Date.now() + 60000, // Default 1 minute
  lastRequest: Date.now(),
};

// Create axios instance with interceptors
const api = axios.create({
  baseURL: "https://api.scryfall.com"
});

// Add response interceptor for rate limit tracking
api.interceptors.response.use((response) => {
  // Update rate limit info from headers
  const remaining = response.headers['x-ratelimit-remaining'];
  const reset = response.headers['x-ratelimit-reset'];

  if (remaining) rateLimitState.remaining = parseInt(remaining, 10);
  if (reset) rateLimitState.reset = parseInt(reset, 10) * 1000; // Convert to milliseconds

  rateLimitState.lastRequest = Date.now();

  // Log rate limit status
  console.log(`Scryfall API Rate Limit: ${rateLimitState.remaining} requests remaining, resets in ${Math.ceil((rateLimitState.reset - Date.now()) / 1000)}s`);

  return response;
}, async (error) => {
  if (error.response?.status === 429) {
    console.warn('Rate limit exceeded, waiting for reset...');
    const retryAfter = error.response.headers['retry-after'];
    if (retryAfter) {
      const delay = parseInt(retryAfter, 10) * 1000;
      await new Promise(resolve => setTimeout(resolve, delay));
      return api.request(error.config);
    }
  }
  throw error;
});

// Add request interceptor for rate limiting
api.interceptors.request.use(async (config) => {
  // Check if we need to wait for rate limit reset
  if (rateLimitState.remaining <= 5) { // Buffer of 5 requests
    const timeUntilReset = rateLimitState.reset - Date.now();
    if (timeUntilReset > 0) {
      console.warn(`Rate limit low (${rateLimitState.remaining} remaining), waiting ${Math.ceil(timeUntilReset / 1000)}s for reset`);
      await new Promise(resolve => setTimeout(resolve, timeUntilReset));
    }
  }

  // Ensure minimum delay between requests (100ms)
  const timeSinceLastRequest = Date.now() - rateLimitState.lastRequest;
  if (timeSinceLastRequest < 100) {
    await new Promise(resolve => setTimeout(resolve, 100 - timeSinceLastRequest));
  }

  return config;
});

export const searchCards = async (query: string) => {
  const response = await api.get(`/cards/search?q=${encodeURIComponent(query)}`);
  return z.array(scryfallCardSchema).parse(response.data.data);
};

export const getCardPrints = async (cardName: string) => {
  const response = await api.get(`/cards/search?q=!"${encodeURIComponent(cardName)}" unique:prints`);
  return z.array(scryfallCardSchema).parse(response.data.data);
};

export const getSetSymbolUrl = (setCode: string) => {
  return `https://svgs.scryfall.io/sets/${setCode}.svg`;
};

export const getCardImageUrl = (card: ScryfallCard): string => {
  // For regular cards, use the main image_uris
  if (card.image_uris?.normal) {
    return card.image_uris.normal;
  }

  // For dual-faced cards, use the front face image
  if (card.card_faces?.[0]?.image_uris?.normal) {
    return card.card_faces[0].image_uris.normal;
  }

  return "";
};