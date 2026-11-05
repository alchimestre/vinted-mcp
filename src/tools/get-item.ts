import type { VintedAPIClient } from "../vinted-core";
import { parseVintedUrl } from "./url";

export const getItemTool = {
  name: "get_item",
  description:
    "Get full details of a Vinted item by ID or URL. Returns price, description, photos and seller info. Vinted removed the item API, so this reads the public item page: it is slower than search and carries no view count or listing date.",
  annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true },
  inputSchema: {
    type: "object",
    properties: {
      itemId: { type: "integer", minimum: 1, description: "Vinted item ID" },
      url: { type: "string", minLength: 1, description: "Vinted item URL (alternative to itemId)" },
      country: { type: "string", description: "Country code", default: "fr" }
    },
    anyOf: [{ required: ["itemId"] }, { required: ["url"] }]
  }
};

export async function handleGetItem(client: VintedAPIClient, args: any): Promise<string> {
  let itemId: number;
  let country: string;

  if (args.url) {
    const parsed = parseVintedUrl(args.url, "items");
    if (!parsed) {
      throw new Error(`Invalid Vinted item URL: ${args.url}`);
    }
    itemId = parsed.id;
    country = parsed.country;
  } else if (args.itemId) {
    itemId = args.itemId;
    country = args.country || "fr";
  } else {
    throw new Error("Either itemId or url must be provided");
  }

  const item = await client.getItem(itemId, country);
  return JSON.stringify(
    {
      id: item.id,
      title: item.title,
      description: item.description,
      price: `${item.price} ${item.currency}`,
      originalPrice: item.originalPrice ? `${item.originalPrice} ${item.currency}` : null,
      brand: item.brand,
      category: item.category,
      size: item.size,
      condition: item.condition,
      color: item.color,
      photos: item.photos,
      favourites: item.favouriteCount,
      isSold: item.isSold,
      url: item.url,
      seller: {
        id: item.seller.id,
        username: item.seller.username,
        rating: item.seller.rating,
        ratingCount: item.seller.ratingCount,
        itemCount: item.seller.itemCount,
        followerCount: item.seller.followerCount,
        profileUrl: item.seller.profileUrl
      }
    },
    null,
    2
  );
}

