import React, { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import "./style.css";
async function api(url, options) {
  const response = await fetch(url, options);
  const data = await response.json();
  if (!response.ok)
    throw new Error(data.error || "Could not connect. Please try again.");
  return data;
}
const energyNames = {
  lazy: "Nice & lazy",
  easy: "A little energy",
  adventure: "A little adventure",
};
function App() {
  const [filters, setFilters] = useState({
      place: "any",
      budget: "0",
      energy: "any",
    }),
    [idea, setIdea] = useState(null),
    [total, setTotal] = useState(0),
    [favorites, setFavorites] = useState([]),
    [page, setPage] = useState("discover"),
    [busy, setBusy] = useState(false),
    [saving, setSaving] = useState(false),
    [error, setError] = useState(""),
    [started, setStarted] = useState(false);
  useEffect(() => {
    api("/api/favorites")
      .then(setFavorites)
      .catch((e) => setError(e.message));
  }, []);
  async function generate() {
    setBusy(true);
    setError("");
    try {
      const data = await api(
        "/api/ideas/random?" +
          new URLSearchParams({ ...filters, exclude: idea?.id || "" }),
      );
      setIdea(data.idea);
      setTotal(data.total);
      setStarted(true);
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  async function toggle(item) {
    setSaving(true);
    setError("");
    try {
      const saved = favorites.some((f) => f.id === item.id);
      await api("/api/favorites/" + item.id, {
        method: saved ? "DELETE" : "PUT",
      });
      setFavorites(await api("/api/favorites"));
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }
  function card(item) {
    const saved = favorites.some((f) => f.id === item.id);
    return (
      <article className="idea-card" key={item.id}>
        <div className={"art " + item.place}>
          <span className="art-orbit" />
          <span className="art-symbol">{item.icon}</span>
          <span className="art-caption">
            {item.place === "home"
              ? "a little closer to cozy"
              : "a little closer to outside"}
          </span>
        </div>
        <div className="idea-body">
          <div className="tags">
            <span>{item.cost === 0 ? "FREE" : `UP TO $${item.cost}`}</span>
            <span>{item.place === "home" ? "AT HOME" : "OUT & ABOUT"}</span>
            <span>{item.minutes} MIN</span>
          </div>
          <h2>{item.title}</h2>
          <p>{item.description}</p>
          <div className="plan">
            <h3>Make it happen</h3>
            <ol>
              {item.steps.map((step) => (
                <li key={step}>{step}</li>
              ))}
            </ol>
          </div>
          <div className="bring">
            <b>Bring along</b>
            <span>{item.bring}</span>
          </div>
          <div className="card-footer">
            <span>↟ {energyNames[item.energy]}</span>
            <button
              className={"save " + (saved ? "saved" : "")}
              disabled={saving}
              onClick={() => toggle(item)}
            >
              {saved ? "♥ Saved" : "♡ Save idea"}
            </button>
          </div>
        </div>
      </article>
    );
  }
  return (
    <>
      <header>
        <a className="brand" href="/" aria-label="Little Weekends home">
          <span className="brand-icon">✳</span> little weekends
          <span className="brand-dot">.</span>
        </a>
        <nav aria-label="Main navigation">
          <button
            className={page === "discover" ? "active" : ""}
            onClick={() => setPage("discover")}
          >
            Discover
          </button>
          <button
            className={page === "saved" ? "active" : ""}
            onClick={() => setPage("saved")}
          >
            ♡ Saved <span className="count">{favorites.length}</span>
          </button>
        </nav>
      </header>
      <main>
        <section className="intro">
          <div className="eyebrow">LESS SCROLLING. MORE LIVING.</div>
          <h1>
            {page === "discover" ? (
              <>
                Good days don’t need
                <br />a <em>big plan.</em>
              </>
            ) : (
              <>
                Little plans.
                <br />
                <em>Worth keeping.</em>
              </>
            )}
          </h1>
          <p>
            {page === "discover"
              ? "Free afternoons, lazy Sundays, and little family adventures.\nFind something to do that feels like you."
              : "Your saved ideas, ready for the next “what should we do?”"}
          </p>
        </section>
        {error && (
          <div role="alert" className="error">
            {error}
          </div>
        )}
        {page === "discover" ? (
          <div className="workspace">
            <aside>
              <div className="panel-heading">
                <span>01 / THE MOOD</span>
                <span>✦</span>
              </div>
              <h2>What kind of day is it?</h2>
              <fieldset disabled={busy}>
                <legend>Where do you want to be?</legend>
                <div className="place-options">
                  {[
                    ["any", "↔", "Either works"],
                    ["out", "☀", "Head outside"],
                    ["home", "⌂", "Stay cozy"],
                  ].map(([value, icon, label]) => (
                    <button
                      key={value}
                      className={filters.place === value ? "selected" : ""}
                      aria-pressed={filters.place === value}
                      onClick={() => setFilters({ ...filters, place: value })}
                    >
                      <span>{icon}</span>
                      {label}
                    </button>
                  ))}
                </div>
              </fieldset>
              <label className="field-label" htmlFor="budget">
                The budget <span>Total activity spend</span>
              </label>
              <select
                id="budget"
                disabled={busy}
                value={filters.budget}
                onChange={(e) =>
                  setFilters({ ...filters, budget: e.target.value })
                }
              >
                <option value="0">Free sounds good · $0</option>
                <option value="5">A little spare change · up to $5</option>
                <option value="10">Keep it small · up to $10</option>
              </select>
              <label className="field-label" htmlFor="energy">
                Your energy level
              </label>
              <select
                id="energy"
                disabled={busy}
                value={filters.energy}
                onChange={(e) =>
                  setFilters({ ...filters, energy: e.target.value })
                }
              >
                <option value="any">Surprise me</option>
                {Object.entries(energyNames).map(([value, label]) => (
                  <option value={value} key={value}>
                    {label}
                  </option>
                ))}
              </select>
              <button className="generate" disabled={busy} onClick={generate}>
                {busy
                  ? "Finding your little plan…"
                  : started
                    ? "Find another idea"
                    : "Find me something to do"}
                <span>↗</span>
              </button>
              <p className="small-note">
                No big spending. No overthinking.
                <br />
                Just a good place to start.
              </p>
            </aside>
            <section className="result" aria-live="polite" aria-busy={busy}>
              <div className="result-label">
                <span>02 / YOUR LITTLE PLAN</span>
                <span>
                  {started ? `${total} matching ideas` : "A little possibility"}
                </span>
              </div>
              {idea ? (
                card(idea)
              ) : (
                <div className="empty-card">
                  <div className="sun-doodle">☀</div>
                  <span className="mini-label">
                    A DAY WELL SPENT STARTS HERE
                  </span>
                  <h2>
                    {started
                      ? "Let’s try a different mood."
                      : "Make room for a little fun."}
                  </h2>
                  <p>
                    {started
                      ? "No ideas match this combination yet. Try a different energy level or budget."
                      : "Pick your mood, press the button, and let a little inspiration find you."}
                  </p>
                  <span className="empty-arrow">↖</span>
                </div>
              )}
            </section>
          </div>
        ) : (
          <section className="saved-grid">
            {favorites.length ? (
              favorites.map(card)
            ) : (
              <div className="empty-card">
                <div className="sun-doodle">♡</div>
                <h2>Your next good day belongs here.</h2>
                <p>
                  Save an idea from Discover and come back to it whenever you
                  like.
                </p>
                <button className="save" onClick={() => setPage("discover")}>
                  Discover ideas ↗
                </button>
              </div>
            )}
          </section>
        )}
        <footer>
          <span>✳ A little time together goes a long way.</span>
          <span>Made for real life, not a highlight reel.</span>
        </footer>
        <p className="fine-print">
          Ideas are general suggestions, not live event listings. Free ideas use
          things you already have; transport, parking, and local access costs
          may vary. Check suitability and opening hours before heading out.
        </p>
      </main>
    </>
  );
}
createRoot(document.getElementById("root")).render(<App />);
