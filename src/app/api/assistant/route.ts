import { NextResponse } from "next/server";
import { assistantRequestSchema } from "@/lib/assistant/schema";
import { runFoodAssistant } from "@/lib/assistant/openrouter";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = assistantRequestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const result = await runFoodAssistant(parsed.data);
    return NextResponse.json(result);
  } catch (err) {
    console.error("Assistant route error", err);
    return NextResponse.json(
      { error: "Food Assistant failed" },
      { status: 500 },
    );
  }
}
