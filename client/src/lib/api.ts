import axios from "axios";
import { z } from "zod";

const scryfallCardSchema = z.object({
  id: z.string(),
  name: z.string(),
  image_uris: z.object({
    normal: z.string()
  }).optional(),
  prices: z.object({
    usd: z.string().nullable(),
    usd_foil: z.string().nullable()
  }),
  set: z.string(),
  set_name: z.string(),
  set_uri: z.string()
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
  const response = await api.get(`/cards/search?q=!"${encodeURIComponent(cardName)}" print:all`);
  return z.array(scryfallCardSchema).parse(response.data.data);
};
