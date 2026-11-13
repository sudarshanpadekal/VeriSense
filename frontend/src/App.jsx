import { useState } from "react";
import axios from "axios";
import "./App.css";

const API_BASE = "http://localhost:8000";

const SAMPLE_POSTS = [
  "BREAKING: A new herbal detox tea removes 100% of microplastics and heavy metals from your bloodstream in 7 days! Doctors don't want you to know this.",
  "Guaranteed 45% monthly returns with zero risk using our new AI crypto arbitrage bot. Limited spots left—DM to double your capital in 30 days!",
  "Phase 3 clinical trial results published in NEJM show mRNA-based personalized cancer vaccines reduced recurrence risk by 44% when combined with immunotherapy.",
  "The ruling party's upcoming election manifesto is the only way to save our nation's economy from total collapse!",
  "True spiritual enlightenment can only be achieved by following our temple's sacred fasting rituals every Monday."
];

export default function App() {
  const [mode, setMode] = useState("manual");
  const [handle, setHandle] = useState("science.org");
  const [manualText, setManualText] = useState(SAMPLE_POSTS.join("\n\n"));
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  const handleAnalyze = async () => {
    setLoading(true);
    setError("");
    setResult(null);
    try {
      if (mode === "bluesky") {
        const res = await axios.post(`${API_BASE}/api/scan/bluesky`, { handle, limit: 10 });
        setResult(res.data);
      } else {
        const posts = manualText.split("\n\n").filter((p) => p.trim());
        const res = await axios.post(`${API_BASE}/api/scan/manual`, { posts });
        setResult(res.data);
      }
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to connect to VeriSense backend.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app-shell">
      <header className="topbar">
        <div>
          <p className="eyebrow">Misinfo detection pipeline</p>
          <h1>VeriSense</h1>
        </div>
        <span className="version-pill">Prototype v0.1</span>
      </header>

      <p className="subtitle">
        AI-Assisted Misinformation Analysis &amp; Media Literacy Pipeline (Strictly Science &amp; Finance)
      </p>

      <div className="mode-toggle" aria-label="Analysis mode selector">
        <button
          type="button"
          className={mode === "manual" ? "mode-button active" : "mode-button"}
          onClick={() => setMode("manual")}
        >
          Sample / Pasted Feed
        </button>
        <button
          type="button"
          className={mode === "bluesky" ? "mode-button active" : "mode-button"}
          onClick={() => setMode("bluesky")}
        >
          Scan Bluesky Account
        </button>
      </div>

      <div className="panel">
        {mode === "bluesky" ? (
          <div className="field-block">
            <label htmlFor="handle-input">Bluesky handle</label>
            <input
              id="handle-input"
              className="field-control"
              type="text"
              value={handle}
              onChange={(e) => setHandle(e.target.value)}
              placeholder="e.g. nasa.bsky.social or science.org"
            />
          </div>
        ) : (
          <div className="field-block">
            <label htmlFor="manual-input">Posts to analyze</label>
            <textarea
              id="manual-input"
              className="field-control textarea-control"
              rows={8}
              value={manualText}
              onChange={(e) => setManualText(e.target.value)}
              placeholder="Separate posts with a blank line..."
            />
          </div>
        )}

        <button type="button" className="primary-button" onClick={handleAnalyze} disabled={loading}>
          {loading ? "Scanning & Verifying..." : "Run VeriSense Pipeline"}
        </button>
      </div>

      {error && <p className="error-message">{error}</p>}

      {result && (
        <div className="results-section">
          <div className="summary-grid">
            <div className="summary-card">
              <span className="summary-label">Total Scanned</span>
              <strong>{result.summary.total_scanned}</strong>
            </div>
            <div className="summary-card success">
              <span className="summary-label">Eligible</span>
              <strong>{result.summary.eligible_count}</strong>
            </div>
            <div className="summary-card danger">
              <span className="summary-label">Excluded</span>
              <strong>{result.summary.excluded_count}</strong>
            </div>
          </div>

          <h2 className="results-heading">Eligible Claims Analyzed</h2>
          {result.eligible_posts.map((item, idx) => (
            <article key={idx} className="result-card">
              <div className="result-meta">
                <span className="domain-badge">{item.analysis.domain}</span>
                <span className="verdict-badge">Verdict: {item.analysis.verdict}</span>
              </div>

              <p className="quoted-text">“{item.text}”</p>

              <div className="detail-list">
                <p>
                  <strong>Extracted Claim:</strong> {item.analysis.extracted_claim}
                </p>
                <p>
                  <strong>Influence / Manipulation Tactics:</strong>{" "}
                  {item.analysis.manipulation_techniques.join(", ")}
                </p>
                <p>
                  <strong>Educational Explanation:</strong> {item.analysis.explanation}
                </p>
              </div>

              {item.evidence_links.length > 0 && (
                <div className="references-block">
                  <strong>PubMed References:</strong>
                  <ul>
                    {item.evidence_links.map((ev, i) => (
                      <li key={i}>
                        <a href={ev.url} target="_blank" rel="noreferrer">
                          {ev.title}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </article>
          ))}

          {result.excluded_posts.length > 0 && (
            <>
              <h3 className="filtered-heading">Filtered Out (Strict Scope Enforcement)</h3>
              {result.excluded_posts.map((ex, idx) => (
                <div key={idx} className="excluded-item">
                  <span className="excluded-domain">[{ex.domain}]</span> {ex.text}
                </div>
              ))}
            </>
          )}
        </div>
      )}
    </div>
  );
}
