import { parseVintedUrl } from "./url";
import type { VintedAPIClient } from "../vinted-core";

export const likeItemTool = {
  name: "like_item",
  description:
    "Add a Vinted item to your favourites (or remove it with unlike). Requires a logged-in session: run 'node dist/bundle.js login' from the checkout once.",
  annotations: { readOnlyHint: false, destructiveHint: true, idempotentHint: false },
  inputSchema: {
    type: "object",
    properties: {
      itemId: { type: "integer", minimum: 1, description: "Vinted item ID" },
      url: { type: "string", minLength: 1, description: "Vinted item URL (alternative to itemId)" },
      country: { type: "string", description: "Country code", default: "fr" },
      unlike: { type: "boolean", description: "Remove the item from favourites instead of adding it", default: false }
    },
    anyOf: [{ required: ["itemId"] }, { required: ["url"] }]
  }
};

export async function handleLikeItem(client: VintedAPIClient, args: any): Promise<string> {
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

  const result = await client.setFavourite(itemId, country, !args.unlike);
  if (!result || result.liked !== !args.unlike) {
    throw new Error("Vinted did not confirm the requested favourite state");
  }
  return JSON.stringify(result, null, 2);
}
