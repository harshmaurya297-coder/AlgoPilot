
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import OpenAI from "openai";
import { z } from "zod";

export const runtime = "nodejs";

const InputSchema = z.object({
  candidates: z.array(
    z.object({
      externalId: z.string().max(50),
      title: z.string().max(300),
      rating: z.number().int(),
      topics: z.array(z.string().max(80)).max(30),
    })
  ).min(1).max(50),
  topic: z.string().min(1).max(80),
}).strict();

export async function POST(request: Request) {
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

    if (!url || !key) {
      return NextResponse.json(
        { error: "Supabase configuration is missing." },
        { status: 500 }
      );
    }

    const token = request.headers.get("authorization")
      ?.replace(/^Bearer /, "");

    if (!token) {
      return NextResponse.json(
        { error: "Sign in first." },
        { status: 401 }
      );
    }

    const supabase = createClient(url, key, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const { data, error } = await supabase.auth.getUser(token);

    if (error || !data.user) {
      return NextResponse.json(
        { error: "Invalid session." },
        { status: 401 }
      );
    }

    const parsed = InputSchema.safeParse(await request.json());

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid candidates or topic." },
        { status: 400 }
      );
    }

    const apiKey = process.env.OPENAI_API_KEY;
    const model = process.env.OPENAI_MODEL;

    if (!apiKey || !model) {
      return NextResponse.json(
        {
          error:
            "AI is not configured. Set OPENAI_API_KEY and OPENAI_MODEL in .env.local.",
        },
        { status: 503 }
      );
    }

    // Only send the verified metadata needed for ranking.
    const candidates = parsed.data.candidates;

    const openai = new OpenAI({ apiKey });

    const result = await openai.responses.create({
      model,
      instructions: [
        "You are a DSA learning-plan organizer.",
        "You receive real Codeforces problems with verified IDs, titles, ratings and tags.",
        "Never invent problems, IDs, URLs, ratings, or tags.",
        "Rank only the supplied IDs, without duplicates.",
        "Prefer a smooth progression from easier to harder within the requested topic.",
        "Return only valid JSON with this exact shape:",
        '{"orderedIds":["contestId-index"],"reason":"brief explanation"}',
        "orderedIds must contain only supplied externalId values.",
      ].join("\n"),
      input: JSON.stringify({
        topic: parsed.data.topic,
        candidates,
      }),
    });

    const text = result.output_text;
    const jsonStart = text.indexOf("{");
    const jsonEnd = text.lastIndexOf("}");

    if (jsonStart < 0 || jsonEnd <= jsonStart) {
      throw new Error("AI returned invalid JSON.");
    }

    const OrganizerSchema = z.object({
      orderedIds: z.array(z.string()).max(50),
      reason: z.string().max(500),
    });

    const output = OrganizerSchema.parse(
      JSON.parse(text.slice(jsonStart, jsonEnd + 1))
    );

    const byId = new Map(
      candidates.map((candidate) => [candidate.externalId, candidate])
    );

    const orderedIds = [...new Set(output.orderedIds)].filter(
      (id) => byId.has(id)
    );

    const ordered = orderedIds.map((id) => byId.get(id)!);

    // Append any valid candidates omitted by the model, so it
    // cannot accidentally reduce the number of available choices.
    const used = new Set(orderedIds);
    for (const candidate of candidates) {
      if (!used.has(candidate.externalId)) ordered.push(candidate);
    }

    return NextResponse.json({
      candidates: ordered,
      reason: output.reason,
      organizedBy: "AI",
      userId: data.user.id,
    });
  } catch (error) {
    console.error("AI organizer failed:", error);

    return NextResponse.json(
      { error: "AI organization failed. Check server logs and try again." },
      { status: 500 }
    );
  }
}
