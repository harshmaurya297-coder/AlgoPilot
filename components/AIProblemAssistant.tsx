
"use client";

import { useState } from "react";

type Problem = {
  externalId: string;
  title: string;
  url: string;
  platform: "Codeforces";
  rating: number;
  difficulty: "Easy" | "Medium";
  topics: string[];
};

export default function AIProblemAssistant() {
  const [topic, setTopic] = useState("binary search");
  const [minRating, setMinRating] = useState(800);
  const [maxRating, setMaxRating] = useState(1200);
  const [quantity, setQuantity] = useState(20);

  const [problems, setProblems] = useState<Problem[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function discoverProblems() {
    setLoading(true);
    setError("");
    setMessage("");
    setProblems([]);
    setSelected([]);

    try {
      const params = new URLSearchParams({
        topic,
        minRating: String(minRating),
        maxRating: String(maxRating),
        limit: String(quantity),
      });

      const response = await fetch(
        `/api/assistant/discover?${params.toString()}`
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Could not discover problems.");
      }

      setProblems(data.problems || []);
      setSelected(
        (data.problems || []).map(
          (problem: Problem) => problem.externalId
        )
      );

      setMessage(
        `Found ${data.count} problems. Review your selection below.`
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong."
      );
    } finally {
      setLoading(false);
    }
  }

  function toggleProblem(externalId: string) {
    setSelected((current) =>
      current.includes(externalId)
        ? current.filter((id) => id !== externalId)
        : [...current, externalId]
    );
  }

  function toggleAll() {
    setSelected((current) =>
      current.length === problems.length
        ? []
        : problems.map((problem) => problem.externalId)
    );
  }

  return (
    <section className="mb-8 rounded-2xl border border-slate-700 bg-slate-900 p-5 sm:p-6">
      <div className="mb-5">
        <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-violet-400">
          AI-powered practice
        </p>

        <h2 className="text-2xl font-semibold text-white">
          AI Problem Assistant
        </h2>

        <p className="mt-2 text-sm text-slate-400">
          Discover real coding problems and build your own DSA roadmap.
        </p>
      </div>

      <form
        className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
        onSubmit={(event) => {
          event.preventDefault();
          void discoverProblems();
        }}
      >
        <label className="text-sm text-slate-300">
          Topic
          
<input
  value={topic}
  onChange={(event) => setTopic(event.target.value)}
  placeholder="e.g. dp, greedy, graphs, trees"
  className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 p-3 text-white"
/>

        </label>

        <label className="text-sm text-slate-300">
          Minimum rating
          <input
            type="number"
            min={800}
            max={4000}
            step={100}
            value={minRating}
            onChange={(event) =>
              setMinRating(Number(event.target.value))
            }
            className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 p-3 text-white"
          />
        </label>

        <label className="text-sm text-slate-300">
          Maximum rating
          <input
            type="number"
            min={800}
            max={4000}
            step={100}
            value={maxRating}
            onChange={(event) =>
              setMaxRating(Number(event.target.value))
            }
            className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 p-3 text-white"
          />
        </label>

        <label className="text-sm text-slate-300">
          Number of problems
          <input
            type="number"
            min={1}
            max={100}
            value={quantity}
            onChange={(event) =>
              setQuantity(Number(event.target.value))
            }
            className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 p-3 text-white"
          />
        </label>

        <button
          type="submit"
          disabled={
            loading ||
            !topic.trim() ||
            !Number.isInteger(minRating) ||
            !Number.isInteger(maxRating) ||
            minRating < 800 ||
            maxRating > 4000 ||
            minRating > maxRating ||
            !Number.isInteger(quantity) ||
            quantity < 1 ||
            quantity > 100
          }
          className="rounded-lg bg-violet-500 px-5 py-3 font-semibold text-white transition hover:bg-violet-400 disabled:cursor-not-allowed disabled:opacity-50 sm:col-span-2 lg:col-span-4"
        >
          {loading ? "Discovering problems..." : "Discover Problems"}
        </button>
      </form>

      {error && (
        <p role="alert" className="mt-4 rounded-lg bg-red-950 p-3 text-sm text-red-300">
          {error}
        </p>
      )}

      {message && (
        <p role="status" className="mt-4 text-sm text-emerald-400">
          {message}
        </p>
      )}

      {problems.length > 0 && (
        <div className="mt-6">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-slate-300">
              {selected.length} of {problems.length} selected
            </p>

            <button
              type="button"
              onClick={toggleAll}
              className="text-sm font-medium text-violet-300 hover:text-violet-200"
            >
              {selected.length === problems.length
                ? "Deselect all"
                : "Select all"}
            </button>
          </div>

          <div className="space-y-3">
            {problems.map((problem) => (
              <label
                key={problem.externalId}
                className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-700 bg-slate-950/60 p-4 hover:border-violet-500"
              >
                <input
                  type="checkbox"
                  checked={selected.includes(problem.externalId)}
                  onChange={() => toggleProblem(problem.externalId)}
                  className="mt-1 accent-violet-500"
                />

                <div className="min-w-0 flex-1">
                  
                <div className="min-w-0 flex-1">
                <a
                    href={problem.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium text-white hover:text-violet-300 hover:underline"
                >
                    {problem.title}
                </a>

                <div className="mt-2 flex flex-wrap gap-2 text-xs">
                    <span className="rounded-md bg-violet-950 px-2 py-1 text-violet-300">
                    Rating: {problem.rating}
                    </span>

                    <span className="rounded-md bg-slate-800 px-2 py-1 text-slate-300">
                    {problem.externalId}
                    </span>

                    {problem.topics.slice(0, 3).map((tag) => (
                    <span
                        key={tag}
                        className="rounded-md bg-slate-800 px-2 py-1 text-slate-400"
                    >
                        {tag}
                    </span>
                    ))}
                </div>

                <a
                    href={problem.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-3 inline-flex items-center gap-2 rounded-lg bg-violet-500 px-3 py-2 text-sm font-medium text-white hover:bg-violet-400"
                >
                    Solve Problem ↗
                </a>
                </div>


                  <div className="mt-2 flex flex-wrap gap-2 text-xs">
                    <span className="rounded-md bg-violet-950 px-2 py-1 text-violet-300">
                      Rating: {problem.rating}
                    </span>

                    <span className="rounded-md bg-slate-800 px-2 py-1 text-slate-300">
                      {problem.externalId}
                    </span>

                    {problem.topics.slice(0, 3).map((tag) => (
                      <span
                        key={tag}
                        className="rounded-md bg-slate-800 px-2 py-1 text-slate-400"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </label>
            ))}
          </div>

          <p className="mt-4 text-sm text-slate-400">
            Your selection is ready for review. Database importing will
            be connected in the next step.
          </p>
        </div>
      )}
    </section>
  );
}
