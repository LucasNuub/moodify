import { useState } from "react";

const MOODS = [
  { emoji: "🌧️", label: "Sad / Heartbroken", color: "#4A7FA5", hint: "missing someone, rainy night, alone" },
  { emoji: "🔥", label: "Hype / Energetic",   color: "#E8562A", hint: "gym, party, feeling unstoppable" },
  { emoji: "🌙", label: "Late Night Vibes",   color: "#7C5CBF", hint: "2am, overthinking, city lights" },
  { emoji: "☀️", label: "Happy / Feel Good",  color: "#F5A623", hint: "good day, road trip, smiling" },
  { emoji: "💭", label: "Deep / Reflective",  color: "#4CAF91", hint: "journaling, walks, self growth" },
  { emoji: "💕", label: "Romantic / Soft",    color: "#D4608A", hint: "crush, slow dancing, butterflies" },
];

function PulsingDots({ color }) {
  return (
    <div style={{ display: "flex", gap: "6px", justifyContent: "center", alignItems: "center", height: "32px" }}>
      {[0, 1, 2].map(i => (
        <div key={i} style={{
          width: "8px", height: "8px", borderRadius: "50%",
          background: color,
          animation: `pulse 1.2s ease-in-out ${i * 0.2}s infinite`,
        }} />
      ))}
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 0.2; transform: scale(0.8); }
          50% { opacity: 1; transform: scale(1.2); }
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .fade-up { animation: fadeUp 0.4s ease forwards; }
        .song-row:hover { background: #1E1D2A !important; }
      `}</style>
    </div>
  );
}

export default function MoodPlaylistCurator() {
  const [mood, setMood] = useState("");
  const [selectedMood, setSelectedMood] = useState(null);
  const [language, setLanguage] = useState("english");
  const [step, setStep] = useState("input");
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  const accent = selectedMood?.color || "#A78BFA";

  async function shuffle() {
    await generate(true);
  }

  async function generate(isShuffle = false) {
    if (!mood.trim()) return;
    setStep("loading");
    setError("");
    const langInstruction = language === "hindi"
      ? "Songs must be in Hindi (Bollywood or Hindi indie). Return actual popular Hindi songs. Use the common romanized/English title spelling artists use."
      : "Songs must be in English.";
    const apiKey = import.meta.env.VITE_GROQ_API_KEY;
    const systemPrompt = `You are a music curator. Given a mood, return ONLY valid JSON (no markdown, no backticks, no explanation):
{
  "playlistName": "creative evocative playlist name (max 5 words)",
  "vibe": "one sentence describing the feeling of this playlist",
  "emoji": "single emoji",
  "searchQuery": "spotify search query to find matching songs (e.g. sad indie heartbreak 2020s)",
  "songs": [
    { "title": "Song Title", "artist": "Artist Name" },
    { "title": "Song Title", "artist": "Artist Name" },
    { "title": "Song Title", "artist": "Artist Name" },
    { "title": "Song Title", "artist": "Artist Name" },
    { "title": "Song Title", "artist": "Artist Name" }
  ]
}
Songs should perfectly match the mood. Be specific, not generic. ${langInstruction}`;
    try {
      const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: "llama-3.3-70b-versatile",
          max_tokens: 1000,
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: `Mood: "${mood}"${selectedMood ? ` — category: ${selectedMood.label}` : ""}. Language: ${language === "hindi" ? "Hindi" : "English"}.${isShuffle ? " Give me a completely different fresh set of 5 songs — avoid obvious or common picks, surprise me." : ""}` }
          ],
        })
      });
      const data = await res.json();
      if (data.error) {
        throw new Error(data.error.message || "API error");
      }
      const raw = data.choices?.[0]?.message?.content || "";
      if (!raw) {
        throw new Error("Empty response from API");
      }
      let clean = raw.replace(/```json|```/g, "").trim();
      // Extract just the JSON object in case there's extra text around it
      const firstBrace = clean.indexOf("{");
      const lastBrace = clean.lastIndexOf("}");
      if (firstBrace !== -1 && lastBrace !== -1) {
        clean = clean.slice(firstBrace, lastBrace + 1);
      }
      const parsed = JSON.parse(clean);
      if (!parsed.songs || !Array.isArray(parsed.songs)) {
        throw new Error("Response missing songs array");
      }
      setResult(parsed);
      setStep("result");
    } catch (e) {
      console.error("Playlist generation error:", e);
      setError("Error: " + (e.message || String(e)));
      setStep("input");
    }
  }

  function openSpotify() {
    const q = encodeURIComponent(result.searchQuery);
    window.open(`https://open.spotify.com/search/${q}`, "_blank");
  }

  function searchSong(title, artist) {
    const q = encodeURIComponent(`${title} ${artist}`);
    window.open(`https://open.spotify.com/search/${q}`, "_blank");
  }

  function reset() {
    setStep("input"); setMood(""); setSelectedMood(null); setResult(null); setError(""); setLanguage("english");
  }

  return (
    <div style={{
      minHeight: "100vh",
      background: "#080810",
      color: "#EDEAF5",
      fontFamily: "'Inter', system-ui, sans-serif",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      padding: "32px 16px 48px",
    }}>
      <style>{`
        * { box-sizing: border-box; }
        textarea:focus { outline: none; }
        button:active { transform: scale(0.98); }
      `}</style>

      {/* Header */}
      <div style={{ textAlign: "center", marginBottom: "36px", maxWidth: "480px" }}>
        <p style={{ fontSize: "11px", letterSpacing: "5px", color: "#3D3A52", textTransform: "uppercase", margin: "0 0 14px" }}>
          AI Playlist Curator
        </p>
        <h1 style={{
          fontSize: "clamp(30px, 6vw, 52px)",
          fontWeight: "800",
          margin: "0 0 10px",
          lineHeight: 1.05,
          background: `linear-gradient(140deg, #fff 30%, ${accent})`,
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          transition: "background 0.6s ease",
        }}>
          How are you feeling?
        </h1>
        <p style={{ color: "#4A475E", fontSize: "14px", margin: "0 0 14px" }}>
          Describe your mood → get song picks → open in Spotify
        </p>
        <span style={{
          display: "inline-block",
          background: "#10101A",
          border: "1px solid #2A2840",
          borderRadius: "100px",
          padding: "5px 14px",
          fontSize: "11px",
          color: "#5A5770",
          letterSpacing: "0.4px",
          boxShadow: `0 0 12px ${accent}22`,
        }}>
          made with <span style={{ color: "#D4608A" }}>❤️</span> by <span style={{ color: accent, fontWeight: "600" }}>Lucas</span>
        </span>
      </div>

      {/* Main card */}
      <div style={{
        width: "100%",
        maxWidth: "500px",
        background: "#10101A",
        borderRadius: "24px",
        border: `1px solid ${step === "result" ? accent + "35" : "#1C1B28"}`,
        padding: "28px",
        transition: "border-color 0.6s, box-shadow 0.6s",
        boxShadow: step === "result" ? `0 0 60px ${accent}18` : "none",
      }}>

        {/* INPUT */}
        {step === "input" && (
          <div className="fade-up">
            <div style={{ display: "flex", flexWrap: "wrap", gap: "7px", marginBottom: "18px" }}>
              {MOODS.map(m => (
                <button key={m.label} onClick={() => { setSelectedMood(m); setMood(m.hint); }}
                  style={{
                    background: selectedMood?.label === m.label ? m.color + "20" : "#15141F",
                    border: `1px solid ${selectedMood?.label === m.label ? m.color + "80" : "#22202E"}`,
                    borderRadius: "100px",
                    color: selectedMood?.label === m.label ? m.color : "#5A5770",
                    padding: "6px 13px",
                    fontSize: "12px",
                    cursor: "pointer",
                    fontFamily: "inherit",
                    transition: "all 0.2s",
                  }}>
                  {m.emoji} {m.label}
                </button>
              ))}
            </div>

            <div style={{ display: "flex", gap: "6px", marginBottom: "14px" }}>
              {[{ label: "EN  English", value: "english" }, { label: "हिं  Hindi", value: "hindi" }].map(({ label, value }) => (
                <button key={value} onClick={() => setLanguage(value)}
                  style={{
                    background: language === value ? accent + "20" : "#15141F",
                    border: `1px solid ${language === value ? accent + "80" : "#22202E"}`,
                    borderRadius: "100px",
                    color: language === value ? accent : "#5A5770",
                    padding: "6px 14px", fontSize: "12px",
                    cursor: "pointer", fontFamily: "inherit", transition: "all 0.2s",
                    fontWeight: language === value ? "600" : "400",
                  }}>
                  {label}
                </button>
              ))}
            </div>

            <textarea
              value={mood}
              onChange={e => setMood(e.target.value)}
              placeholder="Describe your mood... e.g. 'missing someone at 2am, city lights outside, can't sleep'"
              rows={4}
              style={{
                width: "100%", background: "#0C0B14",
                border: `1px solid ${mood ? accent + "45" : "#1C1B28"}`,
                borderRadius: "14px", color: "#EDEAF5",
                padding: "14px 16px", fontSize: "14px",
                fontFamily: "inherit", resize: "none",
                lineHeight: 1.6, transition: "border-color 0.3s",
              }}
            />

            {error && <p style={{ color: "#E8562A", fontSize: "12px", margin: "8px 0 0" }}>{error}</p>}

            <button onClick={generate} disabled={!mood.trim()} style={{
              marginTop: "14px", width: "100%", padding: "14px",
              borderRadius: "14px", border: "none",
              background: mood.trim() ? `linear-gradient(135deg, ${accent}, ${accent}99)` : "#15141F",
              color: mood.trim() ? "#fff" : "#3A3850",
              fontSize: "15px", fontWeight: "600",
              cursor: mood.trim() ? "pointer" : "not-allowed",
              fontFamily: "inherit", transition: "all 0.3s",
            }}>
              ✦ Find My Songs
            </button>
          </div>
        )}

        {/* LOADING */}
        {step === "loading" && (
          <div style={{ textAlign: "center", padding: "28px 0" }}>
            <PulsingDots color={accent} />
            <p style={{ color: "#5A5770", marginTop: "18px", fontSize: "14px" }}>Reading your vibe...</p>
          </div>
        )}

        {/* RESULT */}
        {step === "result" && result && (
          <div className="fade-up">
            {/* Playlist header */}
            <div style={{ textAlign: "center", marginBottom: "22px" }}>
              <div style={{ fontSize: "44px", marginBottom: "10px" }}>{result.emoji}</div>
              <h2 style={{ fontSize: "20px", fontWeight: "700", margin: "0 0 6px", color: "#EDEAF5" }}>
                {result.playlistName}
              </h2>
              <p style={{ color: "#5A5770", fontSize: "13px", margin: 0, lineHeight: 1.5 }}>
                {result.vibe}
              </p>
            </div>

            {/* Song list */}
            <div style={{ marginBottom: "18px" }}>
              <p style={{ fontSize: "11px", letterSpacing: "3px", color: "#3A3850", textTransform: "uppercase", marginBottom: "10px" }}>
                Songs to start with
              </p>
              {result.songs?.map((s, i) => (
                <div key={i} className="song-row" onClick={() => searchSong(s.title, s.artist)}
                  style={{
                    display: "flex", alignItems: "center", gap: "12px",
                    padding: "10px 12px", borderRadius: "10px",
                    cursor: "pointer", transition: "background 0.15s",
                    background: "transparent", marginBottom: "2px",
                  }}>
                  <span style={{ color: "#2E2D3E", fontSize: "12px", width: "16px", textAlign: "right", flexShrink: 0 }}>{i + 1}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: "14px", fontWeight: "500", color: "#EDEAF5", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {s.title}
                    </div>
                    <div style={{ fontSize: "12px", color: "#4A4860", marginTop: "1px" }}>{s.artist}</div>
                  </div>
                  <span style={{ fontSize: "11px", color: "#2E2D3E", flexShrink: 0 }}>↗</span>
                </div>
              ))}
            </div>

            {/* Shuffle */}
            <button onClick={shuffle} style={{
              width: "100%", padding: "13px",
              borderRadius: "12px", border: `1px solid ${accent}40`,
              background: accent + "12",
              color: accent, fontSize: "14px", fontWeight: "600",
              cursor: "pointer", fontFamily: "inherit",
              marginBottom: "10px", transition: "all 0.2s",
            }}>
              🔀 Shuffle — get different songs
            </button>

            {/* Open Spotify */}
            <button onClick={openSpotify} style={{
              width: "100%", padding: "13px",
              borderRadius: "12px", border: "none",
              background: "linear-gradient(135deg, #1DB954, #17a349)",
              color: "#fff", fontSize: "14px", fontWeight: "600",
              cursor: "pointer", fontFamily: "inherit",
              marginBottom: "10px",
            }}>
              🎵 Search this mood on Spotify
            </button>

            <button onClick={reset} style={{
              width: "100%", padding: "11px", borderRadius: "12px",
              border: "1px solid #1C1B28", background: "transparent",
              color: "#3A3850", fontSize: "13px",
              cursor: "pointer", fontFamily: "inherit",
            }}>
              ← Try another mood
            </button>
          </div>
        )}
      </div>

      <p style={{ color: "#1C1B28", fontSize: "11px", marginTop: "24px" }}>
        Powered by Claude AI
      </p>
    </div>
  );
}
