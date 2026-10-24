import { NextResponse } from "next/server";

type CodeforcesProblem = {
  contestId?: number;
  index: string;
  name: string;
  rating?: number;
  tags: string[];
};

type CodeforcesResponse = {
  status: string;
  result?: {
    problems: CodeforcesProblem[];
  };
};

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    const topic = (
      searchParams.get("topic") || "binary search"
    ).trim().toLowerCase();

    const minRating = Number(searchParams.get("minRating") ?? 800);
    const maxRating = Number(searchParams.get("maxRating") ?? 1200);
    const limit = Number(searchParams.get("limit") ?? 20);

    if (
  !topic ||
  topic.length > 60 ||
  !Number.isInteger(minRating) ||
  !Number.isInteger(maxRating) ||
  minRating < 800 ||
  maxRating > 4000 ||
  minRating > maxRating ||
  !Number.isInteger(limit) ||
  limit < 1 ||
  limit > 100
) {
  return NextResponse.json(
    { error: "Invalid topic or filters." },
    { status: 400 }
  );
}
    const response = await fetch(
      "https://codeforces.com/api/problemset.problems",
      {
        headers: {
          Accept: "application/json",
          "User-Agent": "AlgoPilotAI/1.0",
        },
        signal: AbortSignal.timeout(15000),
        cache: "no-store",
      }
    );

    if (!response.ok) {
      return NextResponse.json(
        { error: "Codeforces could not be reached. Please try again." },
        { status: 502 }
      );
    }

    const data =
      (await response.json()) as CodeforcesResponse;

    if (data.status !== "OK" || !data.result) {
      return NextResponse.json(
        { error: "Codeforces returned an unexpected response." },
        { status: 502 }
      );
    }

    const problems = data.result.problems
      .filter((problem) => {
        const rating = problem.rating;

        return (
          problem.contestId !== undefined &&
          rating !== undefined &&
          rating >= minRating &&
          rating <= maxRating &&
          problem.tags.some(
            (tag) => tag.toLowerCase() === topic
          )
        );
      })
      .sort(
        (a, b) =>
          (a.rating ?? 0) - (b.rating ?? 0) ||
          (a.contestId ?? 0) - (b.contestId ?? 0) ||
          a.index.localeCompare(b.index)
      )
      .slice(0, limit)
      .map((problem) => ({
        externalId: `${problem.contestId}${problem.index}`,
        title: problem.name,
        url: `https://codeforces.com/contest/${problem.contestId}/problem/${problem.index}`,
        platform: "Codeforces" as const,
        rating: problem.rating!,
        difficulty: problem.rating! <= 1000 ? "Easy" as const : "Medium" as const,
        topics: problem.tags,
      }));

    return NextResponse.json({
      count: problems.length,
      requested: limit,
      filters: { topic, minRating, maxRating },
      problems,
      message:
        problems.length < limit
          ? `Found ${problems.length} matching problems.`
          : `Found ${problems.length} matching problems.`,
    });
  } catch (error) {
    console.error("Codeforces discovery error:", error);

    return NextResponse.json(
      {
        error:
          "Problem discovery failed. Check your internet connection and try again.",
      },
      { status: 500 }
    );
  }
}
