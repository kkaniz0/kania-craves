import { z } from "zod";

export const assistantRequestSchema = z.object({
  query: z.string().min(1).max(1000),
  location: z
    .object({
      area: z.string(),
      city: z.string(),
      lat: z.number().optional(),
      lng: z.number().optional(),
    })
    .nullable()
    .optional(),
  personalMatches: z
    .array(
      z.object({
        id: z.string(),
        name: z.string(),
        cuisine: z.string(),
        area: z.string(),
        city: z.string(),
        address: z.string().optional(),
        status: z.string(),
        distanceLabel: z.string(),
        score: z.number(),
        priceLevel: z.number().nullable().optional(),
        notes: z.string().optional(),
        recommendedMenu: z.string().optional(),
      }),
    )
    .max(12)
    .default([]),
  tasteSummary: z
    .object({
      favoriteCuisines: z.array(z.string()).default([]),
      favoriteAreas: z.array(z.string()).default([]),
      budgetPreference: z.string().nullable().optional(),
    })
    .optional(),
});

export type AssistantRequest = z.infer<typeof assistantRequestSchema>;

export type AssistantResponse = {
  reply: string;
  personalPicks: Array<{
    id: string;
    why: string;
    mapsUrl: string;
  }>;
  externalInsights: Array<{
    title: string;
    detail: string;
    type: "area" | "cuisine" | "tip" | "place";
  }>;
  discoverIdeas: Array<{
    name: string;
    area: string;
    city: string;
    address?: string;
    why: string;
    mapsUrl: string;
    mapsQuery: string;
  }>;
};

/** Raw model output before we attach guaranteed Maps URLs. */
export const assistantModelSchema = z.object({
  reply: z.string(),
  personalPicks: z
    .array(
      z.object({
        id: z.string(),
        why: z.string(),
      }),
    )
    .default([]),
  externalInsights: z
    .array(
      z.object({
        title: z.string(),
        detail: z.string(),
        type: z.enum(["area", "cuisine", "tip", "place"]),
      }),
    )
    .default([]),
  discoverIdeas: z
    .array(
      z.object({
        name: z.string(),
        area: z.string(),
        city: z.string().optional().default(""),
        address: z.string().optional(),
        why: z.string(),
        mapsQuery: z.string().optional(),
      }),
    )
    .default([]),
});
