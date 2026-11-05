import type { VintedAPIClient } from "../vinted-core";

export const searchItemsTool = {
  name: "search_items",
  description:
    "Search Vinted items with filters. Returns items with price, photos, seller info. Supports 19 countries.",
  annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true },
  inputSchema: {
    type: "object",
    properties: {
      query: { type: "string", pattern: "\\S", description: "Search keywords" },
      country: {
        type: "string",
        description: "Country code (fr, de, uk, it, es, nl, pl, pt, be, at, lt, cz, sk, hu, ro, hr, fi, dk, se)",
        default: "fr"
      },
      priceMin: { type: "number", minimum: 0, description: "Minimum price filter" },
      priceMax: { type: "number", minimum: 0, description: "Maximum price filter" },
      brandIds: { type: "array", items: { type: "integer", minimum: 1 }, description: "Filter by brand IDs" },
      categoryId: { type: "integer", minimum: 1, description: "Vinted category ID filter" },
      condition: {
        type: "array",
        items: { type: "string" },
        description: "Condition filter (new_with_tags, new_without_tags, very_good, good, satisfactory)"
      },
      sortBy: {
        type: "string",
        enum: ["relevance", "price_low_to_high", "price_high_to_low", "newest_first"],
        description: "Sort order"
      },
      limit: { type: "integer", minimum: 1, maximum: 100, description: "Max items to return (max 100)", default: 20 }
    },
    required: ["query"]
  }
};

export async function handleSearchItems(client: VintedAPIClient, args: any): Promise<string> {
  if (args.priceMin !== undefined && args.priceMax !== undefined && args.priceMin > args.priceMax) {
    throw new Error("priceMin must not exceed priceMax");
  }
  const params = {
    query: args.query,
    country: args.country || "fr",
    categoryId: args.categoryId,
    brandIds: args.brandIds,
    priceMin: args.priceMin,
    priceMax: args.priceMax,
    condition: args.condition,
    sortBy: args.sortBy || "relevance",
    perPage: Math.min(args.limit ?? 20, 100),
    page: 1
  };

  const result = await client.searchItems(params);
  const summary = result.items.map((item: any) => ({
    id: item.id,
    title: item.title,
    price: `${item.price} ${item.currency}`,
    brand: item.brand,
    condition: item.condition,
    size: item.size,
    favourites: item.favouriteCount,
    url: item.url,
    seller: item.seller.username
  }));

  return JSON.stringify(
    {
      totalFound: result.totalCount,
      returned: summary.length,
      country: params.country,
      items: summary
    },
    null,
    2
  );
}
