import type { VintedAPIClient } from "../vinted-core";
import { parseVintedUrl } from "./url";

export const getSellerTool = {
  name: "get_seller",
  description: "Get seller profile, stats, recent reviews and recent items from Vinted. Rating is on a 0-5 scale.",
  annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true },
  inputSchema: {
    type: "object",
    properties: {
      sellerId: { type: "integer", minimum: 1, description: "Vinted seller/user ID" },
      url: { type: "string", minLength: 1, description: "Vinted seller profile URL (alternative to sellerId)" },
      country: { type: "string", description: "Country code", default: "fr" },
      includeItems: {
        type: "boolean",
        description: "Include the seller's listings. Vinted returns an empty wardrobe to anonymous callers, so this needs a logged-in session (vinted-mcp login).",
        default: true
      },
      itemLimit: { type: "integer", minimum: 1, maximum: 100, description: "Max items to include", default: 20 }
    },
    anyOf: [{ required: ["sellerId"] }, { required: ["url"] }]
  }
};

export async function handleGetSeller(client: VintedAPIClient, args: any): Promise<string> {
  let sellerId: number;
  let country: string;

  if (args.url) {
    const parsed = parseVintedUrl(args.url, "member");
    if (!parsed) {
      throw new Error(`Invalid Vinted seller URL: ${args.url}`);
    }
    sellerId = parsed.id;
    country = parsed.country;
  } else if (args.sellerId) {
    sellerId = args.sellerId;
    country = args.country || "fr";
  } else {
    throw new Error("Either sellerId or url must be provided");
  }

  const seller = await client.getSeller(sellerId, country);
  const result: any = {
    id: seller.id,
    username: seller.username,
    profileUrl: seller.profileUrl,
    rating: seller.rating,
    ratingCount: seller.ratingCount,
    itemCount: seller.itemCount,
    soldItemCount: seller.soldItemCount,
    followerCount: seller.followerCount,
    followingCount: seller.followingCount,
    country: seller.country,
    city: seller.city,
    verifications: seller.verifications,
    recentReviews: seller.reviews.slice(0, 5)
  };

  if (seller.createdAt) {
    result.memberSince = seller.createdAt;
  }

  if (args.includeItems !== false) {
    result.recentItems = seller.items.slice(0, args.itemLimit || 20).map((item: any) => ({
      id: item.id,
      title: item.title,
      price: `${item.price} ${item.currency}`,
      brand: item.brand,
      url: item.url
    }));
  }

  return JSON.stringify(result, null, 2);
}

