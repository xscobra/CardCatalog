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

const api = axios.create({
  baseURL: "https://api.scryfall.com"
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