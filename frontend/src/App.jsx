import { useState } from "react";
import axios from "axios";

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
    <div style={{ maxWidth: "960px", margin: "0 auto", padding: "2rem", fontFamily: "system-ui, sans-serif" }}>
      <header style={{ borderBottom: "1px solid #e5e7eb", paddingBottom: "1rem", marginBottom: "1.5rem" }}>
        <h1 style={{ margin: 0, fontSize: "1.8rem" }}>VeriSense — Prototype v0.1</h1>
        <p style={{ color: "#4b5563", margin: "0.4rem 0 0" }}>
          AI-Assisted Misinformation Analysis & Media Literacy Pipeline (Strictly Science & Finance)
        </p>
      </header>

      <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1rem" }}>
        <button
          onClick={() => setMode("manual")}
          style={{
            padding: "0.5rem 1rem",
            fontWeight: mode === "manual" ? "bold" : "normal",
            cursor: "pointer",
          }}
        >
          Sample / Pasted Feed
        </button>
        <button
          onClick={() => setMode("bluesky")}
          style={{
            padding: "0.5rem 1rem",
            fontWeight: mode === "bluesky" ? "bold" : "normal",
            cursor: "pointer",
          }}
        >
          Scan Bluesky Account
        </button>
      </div>

      {mode === "bluesky" ? (
        <div style={{ marginBottom: "1rem" }}>
          <input
            type="text"
            value={handle}
            onChange={(e) => setHandle(e.target.value)}
            placeholder="e.g. nasa.bsky.social or science.org"
            style={{ width: "100%", padding: "0.6rem", fontSize: "1rem", boxSizing: "border-box" }}
          />
        </div>
      ) : (
        <div style={{ marginBottom: "1rem" }}>
          <textarea
            rows={8}
            value={manualText}
            onChange={(e) => setManualText(e.target.value)}
            placeholder="Separate posts with a blank line..."
            style={{ width: "100%", padding: "0.6rem", fontSize: "0.95rem", boxSizing: "border-box" }}
          />
        </div>
      )}

      <button
        onClick={handleAnalyze}
        disabled={loading}
        style={{
          padding: "0.7rem 1.5rem",
          backgroundColor: "#2563eb",
          color: "white",
          border: "none",
          borderRadius: "6px",
          cursor: loading ? "not-allowed" : "pointer",
          fontSize: "1rem",
        }}
      >
        {loading ? "Scanning & Verifying..." : "Run VeriSense Pipeline"}
      </button>

      {error && <p style={{ color: "#dc2626", marginTop: "1rem" }}>{error}</p>}

      {result && (
        <div style={{ marginTop: "2rem" }}>
          <div
            style={{
              display: "flex",
              gap: "1.5rem",
              marginBottom: "1.5rem",
              background: "#f3f4f6",
              padding: "1rem",
              borderRadius: "8px",
            }}
          >
            <div>
              <strong>Total Scanned:</strong> {result.summary.total_scanned}
            </div>
            <div style={{ color: "#059669" }}>
              <strong>Eligible (Science/Finance):</strong> {result.summary.eligible_count}
            </div>
            <div style={{ color: "#dc2626" }}>
              <strong>Excluded (Politics/Religion/Other):</strong> {result.summary.excluded_count}
            </div>
          </div>

          <h2>Eligible Claims Analyzed</h2>
          {result.eligible_posts.map((item, idx) => (
            <div
              key={idx}
              style={{
                border: "1px solid #d1d5db",
                borderRadius: "8px",
                padding: "1rem",
                marginBottom: "1rem",
              }}
            >
              <div style={{ display: "flex", gap: "0.5rem", marginBottom: "0.5rem" }}>
                <span
                  style={{
                    background: "#dbeafe",
                    color: "#1e40af",
                    padding: "2px 8px",
                    borderRadius: "4px",
                    fontSize: "0.85rem",
                    fontWeight: "bold",
                  }}
                >
                  {item.analysis.domain}
                </span>
                <span
                  style={{
                    background: "#fef3c7",
                    color: "#92400e",
                    padding: "2px 8px",
                    borderRadius: "4px",
                    fontSize: "0.85rem",
                    fontWeight: "bold",
                  }}
                >
                  Verdict: {item.analysis.verdict}
                </span>
              </div>
              <p style={{ fontStyle: "italic", color: "#374151" }}>"{item.text}"</p>
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
              {item.evidence_links.length > 0 && (
                <div>
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
            </div>
          ))}

          {result.excluded_posts.length > 0 && (
            <>
              <h3 style={{ color: "#6b7280", marginTop: "2rem" }}>
                Filtered Out (Strict Scope Enforcement)
              </h3>
              {result.excluded_posts.map((ex, idx) => (
                <div
                  key={idx}
                  style={{
                    background: "#f9fafb",
                    border: "1px dashed #d1d5db",
                    padding: "0.75rem",
                    marginBottom: "0.5rem",
                    borderRadius: "6px",
                  }}
                >
                  <span style={{ fontWeight: "bold", color: "#dc2626" }}>[{ex.domain}]</span>{" "}
                  {ex.text}
                </div>
              ))}
            </>
          )}
        </div>
      )}
    </div>
  );
}