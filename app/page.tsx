"use client";

import AIProblemAssistant from "@/components/AIProblemAssistant";

import { useCallback, useEffect, useState } from "react";
import {
  Activity,
  BrainCircuit,
  CheckCircle2,
  CirclePlus,
  Code2,
  ExternalLink,
  Filter,
  LogOut,
  Plus,
  Search,
  Trash2,
  Trophy,
} from "lucide-react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";

type Platform = "LeetCode" | "Codeforces" | "Other";
type Difficulty = "Easy" | "Medium" | "Hard" | "Unrated";
type ProblemStatus = "Todo" | "Attempted" | "Solved";

type Problem = {
  id: string;
  user_id: string;
  title: string;
  url: string;
  platform: Platform;
  difficulty: Difficulty;
  topics: string[];
  status: ProblemStatus;
  notes: string;
  created_at: string;
};

const initialForm = {
  title: "",
  url: "",
  platform: "LeetCode" as Platform,
  difficulty: "Medium" as Difficulty,
  topics: "Arrays",
};

export default function Home() {
  const [session, setSession] = useState<Session | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isRegistering, setIsRegistering] = useState(false);
  const [problems, setProblems] = useState<Problem[]>([]);
  const [form, setForm] = useState(initialForm);
  const [search, setSearch] = useState("");
  const [platformFilter, setPlatformFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [showForm, setShowForm] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  const loadProblems = useCallback(async () => {
    const { data, error } = await supabase
      .from("problems")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      setMessage(error.message);
      return;
    }

    setProblems((data ?? []) as Problem[]);
  }, []);

  useEffect(() => {
    let active = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      setSession(data.session);
      setAuthReady(true);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      setAuthReady(true);
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
  let cancelled = false;

  async function refreshProblems() {
    if (!session?.user.id) {
      setProblems([]);
      return;
    }

    const { data, error } = await supabase
      .from("problems")
      .select("*")
      .order("created_at", { ascending: false });

    if (cancelled) return;

    if (error) {
      setMessage(error.message);
      return;
    }

    setProblems((data ?? []) as Problem[]);
  }

  void refreshProblems();

  return () => {
    cancelled = true;
  };
}, [session?.user.id]);

  async function authenticate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage("");

    try {
      const result = isRegistering
        ? await supabase.auth.signUp({ email, password })
        : await supabase.auth.signInWithPassword({ email, password });

      if (result.error) throw result.error;

      if (isRegistering && !result.data.session) {
        setMessage(
          "Account created. Check your email to confirm your account, then sign in."
        );
      } else {
        setMessage(
          isRegistering ? "Account created!" : "Welcome back!"
        );
      }
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Authentication failed."
      );
    } finally {
      setBusy(false);
    }
  }

  async function addProblem(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!session?.user.id) return;

    const cleanTitle = form.title.trim();
    const cleanUrl = form.url.trim();

    try {
      const parsedUrl = new URL(cleanUrl);
      if (!["http:", "https:"].includes(parsedUrl.protocol)) {
        throw new Error("Use a valid HTTP or HTTPS URL.");
      }
    } catch {
      setMessage("Enter a valid problem URL beginning with https://");
      return;
    }

    if (!cleanTitle) {
      setMessage("Enter a problem title.");
      return;
    }

    setBusy(true);
    setMessage("");

    try {
      const { error } = await supabase.from("problems").insert({
        user_id: session.user.id,
        title: cleanTitle,
        url: cleanUrl,
        platform: form.platform,
        difficulty: form.difficulty,
        topics: form.topics
          .split(",")
          .map((topic) => topic.trim())
          .filter(Boolean),
        status: "Todo",
      });

      if (error) throw error;

      setForm(initialForm);
      setShowForm(false);
      await loadProblems();
      setMessage("Problem added successfully.");
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Could not add problem."
      );
    } finally {
      setBusy(false);
    }
  }

  async function updateStatus(problem: Problem) {
    const nextStatus: ProblemStatus =
      problem.status === "Solved" ? "Todo" : "Solved";

    const { error } = await supabase
      .from("problems")
      .update({
        status: nextStatus,
        updated_at: new Date().toISOString(),
      })
      .eq("id", problem.id);

    if (error) {
      setMessage(error.message);
      return;
    }

    setProblems((current) =>
      current.map((item) =>
        item.id === problem.id
          ? { ...item, status: nextStatus }
          : item
      )
    );
  }

  async function deleteProblem(id: string) {
    if (!window.confirm("Delete this problem from your list?")) return;

    const { error } = await supabase
      .from("problems")
      .delete()
      .eq("id", id);

    if (error) {
      setMessage(error.message);
      return;
    }

    setProblems((current) => current.filter((item) => item.id !== id));
    setMessage("Problem deleted.");
  }

  async function signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) setMessage(error.message);
  }

  const filteredProblems = problems.filter((problem) => {
    const query = search.toLowerCase();
    const matchesSearch =
      problem.title.toLowerCase().includes(query) ||
      problem.topics.some((topic) => topic.toLowerCase().includes(query));

    return (
      matchesSearch &&
      (platformFilter === "All" || problem.platform === platformFilter) &&
      (statusFilter === "All" || problem.status === statusFilter)
    );
  });

  const solvedCount = problems.filter((p) => p.status === "Solved").length;
  const attemptedCount = problems.filter(
    (p) => p.status === "Attempted"
  ).length;

  if (!authReady) {
    return <main className="auth-screen">Loading AlgoPilot AI...</main>;
  }

  if (!session) {
    return (
      <main className="auth-screen">
        <form className="auth-card" onSubmit={authenticate}>
          <div className="brand-icon"><BrainCircuit size={30} /></div>
          <p className="eyebrow">YOUR PERSONAL DSA COMPANION</p>
          <h1>AlgoPilot AI</h1>
          <p className="muted">
            Organize problems. Build consistency. Improve your problem-solving.
          </p>

          <label htmlFor="email">Email</label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
          />

          <label htmlFor="password">Password</label>
          <input
            id="password"
            type="password"
            autoComplete={isRegistering ? "new-password" : "current-password"}
            minLength={6}
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="At least 6 characters"
          />

          <button className="primary-button full-width" disabled={busy}>
            {busy
              ? "Please wait..."
              : isRegistering
                ? "Create account"
                : "Sign in"}
          </button>

          <button
            type="button"
            className="text-button"
            onClick={() => {
              setIsRegistering((value) => !value);
              setMessage("");
            }}
          >
            {isRegistering
              ? "Already have an account? Sign in"
              : "New here? Create an account"}
          </button>

          {message && <p className="notice">{message}</p>}
        </form>
      </main>
    );
  }

  return (
    <main className="app-shell">
      <aside className="sidebar">
        <a className="brand" href="#">
          <span className="brand-icon"><BrainCircuit size={25} /></span>
          <span>AlgoPilot <span className="accent">AI</span></span>
        </a>

        <p className="nav-heading">WORKSPACE</p>
        <a className="nav-link active" href="#problems">
          <Code2 size={18} /> My Problems
        </a>
        <a className="nav-link" href="#stats">
          <Activity size={18} /> Progress
        </a>
        <a className="nav-link" href="#agents">
          <BrainCircuit size={18} /> AI Agents
          <span className="coming-soon">SOON</span>
        </a>

        <div className="sidebar-bottom">
          <p className="muted small">{session.user.email}</p>
          <button className="secondary-button" onClick={signOut}>
            <LogOut size={16} /> Sign out
          </button>
        </div>
      </aside>

      <section className="main-content">
        <header className="topbar">
          <div>
            <p className="eyebrow">YOUR DAILY PRACTICE</p>
            <h1>DSA Command Center</h1>
          </div>
          <button
            className="primary-button"
            onClick={() => setShowForm((value) => !value)}
          >
            <Plus size={18} /> Add problem
          </button>
        </header>

        {message && (
          <div className="notice" role="status">
            {message}
            <button
              className="dismiss-button"
              onClick={() => setMessage("")}
              aria-label="Dismiss message"
            >
              ×
            </button>
          </div>
        )}

        <section className="stats-grid" id="stats">
          <article className="stat-card">
            <div className="stat-label"><Code2 size={17} /> Total problems</div>
            <strong>{problems.length}</strong>
            <span className="muted small">In your personal library</span>
          </article>
          <article className="stat-card">
            <div className="stat-label"><CheckCircle2 size={17} /> Solved</div>
            <strong>{solvedCount}</strong>
            <span className="muted small">Completed problems</span>
          </article>
          <article className="stat-card">
            <div className="stat-label"><Activity size={17} /> Attempted</div>
            <strong>{attemptedCount}</strong>
            <span className="muted small">Still in progress</span>
          </article>
          <article className="stat-card">
            <div className="stat-label"><Trophy size={17} /> Completion</div>
            <strong>
              {problems.length
                ? Math.round((solvedCount / problems.length) * 100)
                : 0}%
            </strong>
            <span className="muted small">Of your saved list</span>
          </article>
        </section>

        <AIProblemAssistant />

        {showForm && (
          <form className="problem-form panel" onSubmit={addProblem}>
            <div className="section-title">
              <CirclePlus size={20} />
              <h2>Add a problem</h2>
            </div>

            <label htmlFor="title">Problem title</label>
            <input
              id="title"
              required
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="e.g. Binary Search"
            />

            <label htmlFor="url">Problem URL</label>
            <input
              id="url"
              type="url"
              required
              value={form.url}
              onChange={(e) => setForm({ ...form, url: e.target.value })}
              placeholder="https://leetcode.com/problems/..."
            />

            <div className="form-grid">
              <div>
                <label htmlFor="platform">Platform</label>
                <select
                  id="platform"
                  value={form.platform}
                  onChange={(e) =>
                    setForm({ ...form, platform: e.target.value as Platform })
                  }
                >
                  <option>LeetCode</option>
                  <option>Codeforces</option>
                  <option>Other</option>
                </select>
              </div>
              <div>
                <label htmlFor="difficulty">Difficulty</label>
                <select
                  id="difficulty"
                  value={form.difficulty}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      difficulty: e.target.value as Difficulty,
                    })
                  }
                >
                  <option>Easy</option>
                  <option>Medium</option>
                  <option>Hard</option>
                  <option>Unrated</option>
                </select>
              </div>
            </div>

            <label htmlFor="topics">Topics (comma-separated)</label>
            <input
              id="topics"
              value={form.topics}
              onChange={(e) => setForm({ ...form, topics: e.target.value })}
              placeholder="Arrays, Binary Search, DP"
            />

            <div className="form-actions">
              <button
                type="button"
                className="secondary-button"
                onClick={() => setShowForm(false)}
              >
                Cancel
              </button>
              <button className="primary-button" disabled={busy}>
                <Plus size={17} /> {busy ? "Saving..." : "Save problem"}
              </button>
            </div>
          </form>
        )}

        <section className="panel" id="problems">
          <div className="section-title">
            <div>
              <h2>My problem list</h2>
              <p className="muted small">
                Your cloud-synced DSA practice library
              </p>
            </div>
            <span className="count-pill">{filteredProblems.length} problems</span>
          </div>

          <div className="filters">
            <div className="search-box">
              <Search size={17} />
              <input
                aria-label="Search problems"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search title or topic..."
              />
            </div>
            <div className="filter-box">
              <Filter size={16} />
              <select
                aria-label="Filter by platform"
                value={platformFilter}
                onChange={(e) => setPlatformFilter(e.target.value)}
              >
                <option>All</option>
                <option>LeetCode</option>
                <option>Codeforces</option>
                <option>Other</option>
              </select>
            </div>
            <select
              aria-label="Filter by status"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option>All</option>
              <option>Todo</option>
              <option>Attempted</option>
              <option>Solved</option>
            </select>
          </div>

          {filteredProblems.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon"><Code2 size={27} /></div>
              <h3>{problems.length ? "No matching problems" : "Start your DSA journey"}</h3>
              <p className="muted">
                {problems.length
                  ? "Try changing your search or filters."
                  : "Add your first problem and start building your personal roadmap."}
              </p>
              {!problems.length && (
                <button
                  className="primary-button"
                  onClick={() => setShowForm(true)}
                >
                  <Plus size={17} /> Add your first problem
                </button>
              )}
            </div>
          ) : (
            <div className="problem-list">
              {filteredProblems.map((problem) => (
                <article className="problem-row" key={problem.id}>
                  <button
                    className={`status-check ${problem.status === "Solved" ? "checked" : ""}`}
                    onClick={() => void updateStatus(problem)}
                    title="Toggle solved status"
                    aria-label={`Mark ${problem.title} ${
                      problem.status === "Solved" ? "unsolved" : "solved"
                    }`}
                  >
                    {problem.status === "Solved" && <CheckCircle2 size={19} />}
                  </button>

                  <div className="problem-info">
                    <a
                      className="problem-name"
                      href={problem.url}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {problem.title} <ExternalLink size={13} />
                    </a>
                    <div className="problem-meta">
                      <span>{problem.platform}</span>
                      <span>{problem.topics.join(" · ") || "No topics"}</span>
                    </div>
                  </div>

                  <span className={`difficulty ${problem.difficulty.toLowerCase()}`}>
                    {problem.difficulty}
                  </span>
                  <span className={`status-pill ${problem.status.toLowerCase()}`}>
                    {problem.status}
                  </span>
                  <button
                    className="icon-button delete-button"
                    onClick={() => void deleteProblem(problem.id)}
                    aria-label={`Delete ${problem.title}`}
                    title="Delete problem"
                  >
                    <Trash2 size={17} />
                  </button>
                </article>
              ))}
            </div>
          )}
        </section>

        <section className="agent-panel" id="agents">
          <div className="agent-symbol"><BrainCircuit size={23} /></div>
          <div>
            <h2>Your AI team is next</h2>
            <p className="muted">
              Problem discovery, duplicate detection, and personalized roadmap
              generation are planned for the next phase.
            </p>
          </div>
          <span className="count-pill">Phase 2</span>
        </section>

        <footer className="footer">
          Built for consistency, one problem at a time.
        </footer>
      </section>
    </main>
  );
}
