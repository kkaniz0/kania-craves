import {
  assistantModelSchema,
  type AssistantRequest,
  type AssistantResponse,
} from "./schema";
import {
  googleMapsDirectionsUrl,
  googleMapsPlaceUrl,
} from "@/lib/maps/google";

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";

function buildSystemPrompt(): string {
  return `You are Kania Craves Food Assistant — a warm, concise food guide for Indonesia (and nearby cities).

RULES:
1. Personal database is sacred: ONLY treat restaurants in "personalMatches" as the user's saved places. Never invent that an external place is already saved.
2. discoverIdeas MUST be REAL restaurants that exist on Google Maps near the asked area. Use the exact Google business name when possible (e.g. "Sushi Tei Blok M Plaza", "Osteria Gia Pacific Place").
3. For every discoverIdea include:
   - name: exact searchable place name
   - area: neighborhood / mall
   - city: e.g. Jakarta / Bali
   - address: street or mall unit if known
   - mapsQuery: full Google Maps search string = "Name, Area, City, Indonesia" (must be specific enough to find ONE place)
   - why: short reason
4. Prefer Bahasa Indonesia santai. Be short and practical.
5. If personalMatches is empty, still give external insights + discoverIdeas.
6. personalPicks ids MUST come from personalMatches only.
7. Respond with JSON ONLY:
{
  "reply": "string",
  "personalPicks": [{ "id": "...", "why": "..." }],
  "externalInsights": [{ "title": "...", "detail": "...", "type": "area"|"cuisine"|"tip"|"place" }],
  "discoverIdeas": [{ "name": "...", "area": "...", "city": "...", "address": "...", "mapsQuery": "...", "why": "..." }]
}
Max 5 personalPicks, 4 externalInsights, 4 discoverIdeas.
Never invent fake chains or made-up addresses.`;
}

function buildUserPayload(input: AssistantRequest): string {
  return JSON.stringify(
    {
      question: input.query,
      userLocation: input.location ?? null,
      tasteSummary: input.tasteSummary ?? null,
      personalMatches: input.personalMatches,
    },
    null,
    2,
  );
}

function originFrom(input: AssistantRequest) {
  if (input.location?.lat != null && input.location?.lng != null) {
    return { lat: input.location.lat, lng: input.location.lng };
  }
  return null;
}

function enrichPersonalPicks(
  input: AssistantRequest,
  picks: Array<{ id: string; why: string }>,
): AssistantResponse["personalPicks"] {
  const origin = originFrom(input);
  const byId = new Map(input.personalMatches.map((m) => [m.id, m]));
  return picks.map((p) => {
    const m = byId.get(p.id);
    const mapsUrl = m
      ? googleMapsDirectionsUrl(
          {
            name: m.name,
            address: m.address,
            area: m.area,
            city: m.city,
          },
          origin,
        )
      : googleMapsPlaceUrl({ name: p.id });
    return { ...p, mapsUrl };
  });
}

function enrichDiscoverIdeas(
  input: AssistantRequest,
  ideas: Array<{
    name: string;
    area: string;
    city?: string;
    address?: string;
    why: string;
    mapsQuery?: string;
  }>,
): AssistantResponse["discoverIdeas"] {
  const origin = originFrom(input);
  const fallbackCity = input.location?.city || "Jakarta";

  return ideas.map((idea) => {
    const city = idea.city?.trim() || fallbackCity;
    const mapsQuery =
      idea.mapsQuery?.trim() ||
      [idea.name, idea.address, idea.area, city, "Indonesia"]
        .filter((p) => !!p && String(p).trim().length > 0)
        .join(", ");

    const params = new URLSearchParams({
      api: "1",
      destination: mapsQuery,
      travelmode: "walking",
    });
    if (origin) {
      params.set("origin", `${origin.lat},${origin.lng}`);
    }
    const mapsUrl = `https://www.google.com/maps/dir/?${params.toString()}`;

    return {
      name: idea.name,
      area: idea.area,
      city,
      address: idea.address,
      why: idea.why,
      mapsQuery,
      mapsUrl,
    };
  });
}

function fallbackResponse(input: AssistantRequest): AssistantResponse {
  const area = input.location?.area ?? "area kamu";
  const city = input.location?.city ?? "Jakarta";
  const picks = enrichPersonalPicks(
    input,
    input.personalMatches.slice(0, 5).map((m) => ({
      id: m.id,
      why: `${m.status} · ${m.distanceLabel} · ${m.score}% match`,
    })),
  );

  return {
    reply: picks.length
      ? `Dari list kamu, ini yang paling cocok. Cek Google Maps di tiap kartu.`
      : `Belum ketemu match di list kamu. Ini insight untuk sekitar ${area}.`,
    personalPicks: picks,
    externalInsights: [
      {
        title: `Vibe ${area}`,
        detail:
          "Cek jam buka & antrian di Google Maps sebelum berangkat — area populer sering penuh jam makan malam.",
        type: "area",
      },
      {
        title: "Budget tip",
        detail:
          "Untuk dinner casual Jakarta Selatan, 100–250rb/orang biasanya cukup kecuali fine dining.",
        type: "tip",
      },
    ],
    discoverIdeas: enrichDiscoverIdeas(input, [
      {
        name: "Sushi Tei",
        area: area.includes("Blok") ? "Blok M Plaza" : area,
        city,
        mapsQuery: `Sushi Tei, ${area}, ${city}, Indonesia`,
        why: "Japanese chain yang mudah ditemukan di Google Maps.",
      },
    ]),
  };
}

export async function runFoodAssistant(
  input: AssistantRequest,
): Promise<AssistantResponse> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    return fallbackResponse(input);
  }

  const model = process.env.OPENROUTER_MODEL || "openai/gpt-4o-mini";

  const res = await fetch(OPENROUTER_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": "https://kania-craves.local",
      "X-Title": "Kania Craves Food Assistant",
    },
    body: JSON.stringify({
      model,
      temperature: 0.4,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: buildSystemPrompt() },
        { role: "user", content: buildUserPayload(input) },
      ],
    }),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    console.error("OpenRouter error", res.status, errText.slice(0, 500));
    const fb = fallbackResponse(input);
    return {
      ...fb,
      reply: `${fb.reply} (AI eksternal lagi bermasalah — pakai rekomendasi lokal dulu.)`,
    };
  }

  const data = (await res.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const content = data.choices?.[0]?.message?.content;
  if (!content) return fallbackResponse(input);

  try {
    const parsed = JSON.parse(content) as unknown;
    const validated = assistantModelSchema.parse(parsed);

    const allowed = new Set(input.personalMatches.map((m) => m.id));
    let personalRaw = validated.personalPicks.filter((p) => allowed.has(p.id));
    if (!personalRaw.length && input.personalMatches.length) {
      personalRaw = input.personalMatches.slice(0, 5).map((m) => ({
        id: m.id,
        why: `${m.status} · ${m.distanceLabel}`,
      }));
    }

    return {
      reply: validated.reply,
      personalPicks: enrichPersonalPicks(input, personalRaw),
      externalInsights: validated.externalInsights,
      discoverIdeas: enrichDiscoverIdeas(input, validated.discoverIdeas),
    };
  } catch (err) {
    console.error("Assistant JSON parse failed", err);
    return fallbackResponse(input);
  }
}
