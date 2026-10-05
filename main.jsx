import React, { useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import { Search, ExternalLink, Music2, Sparkles, Copy, Check, AlertCircle } from "lucide-react";
import "./styles.css";

const demo = "Blinding Lights - The Weeknd\nShape of You - Ed Sheeran\nAnother Love - Tom Odell";
const lines = text => text.split(/\r?\n/).map(x => x.trim()).filter(Boolean);

function App() {
  const [input, setInput] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const count = useMemo(() => lines(input).length, [input]);

  async function search(e) {
    e.preventDefault();
    const queries = lines(input);
    setSearched(true);
    setError("");
    setCopied(false);
    if (!queries.length) {
      setResults([]);
      setError("Bitte gib mindestens einen Songtitel ein.");
      return;
    }

    setLoading(true);
    try {
      const r = await fetch("/api/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ queries })
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || "Suche fehlgeschlagen.");
      setResults(data.results || []);
    } catch (err) {
      setResults([]);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function copyLinks() {
    const text = results.filter(x => x.result)
      .map(x => `${x.result.title} – ${x.result.artist}\n${x.result.url}`)
      .join("\n\n");
    if (!text) return;
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  }

  return <div className="app">
    <header>
      <div className="brand"><div className="icon"><Music2 size={19}/></div>Spotify Song Finder</div>
      <button className="ghost" onClick={() => setInput(demo)}><Sparkles size={15}/> Beispiel</button>
    </header>

    <main>
      <section className="hero">
        <div className="eyebrow"><span/> SPOTIFY LINK FINDER</div>
        <h1>Finde jeden Song.<br/><em>Direkt auf Spotify.</em></h1>
        <p>Füge einen oder mehrere Songs ein und erhalte automatisch die passenden Spotify-Track-Links.</p>

        <form className="card" onSubmit={search}>
          <div className="input">
            <Search size={20}/>
            <textarea value={input} onChange={e => setInput(e.target.value)}
              placeholder={"Blinding Lights - The Weeknd\nShape of You - Ed Sheeran"} rows="6"/>
          </div>
          <div className="bar">
            <span>{count} {count === 1 ? "Song" : "Songs"} erkannt</span>
            <button className="search" disabled={loading}>
              {loading ? "Spotify wird durchsucht…" : "Spotify-Links finden"} <ExternalLink size={16}/>
            </button>
          </div>
        </form>

        {error && <div className="notice"><AlertCircle size={17}/>{error}</div>}
      </section>

      {searched && <section className="results">
        <div className="result-head">
          <div><div className="eyebrow left"><span/> ERGEBNISSE</div><h2>Deine Spotify-Treffer</h2></div>
          <button className="ghost" onClick={copyLinks}>{copied ? <Check size={15}/> : <Copy size={15}/>} {copied ? "Kopiert" : "Links kopieren"}</button>
        </div>

        {results.map((item, i) => item.result ? <article className="song" key={i}>
          <div className="cover">{item.result.image ? <img src={item.result.image}/> : <Music2/>}</div>
          <div className="info">
            <small>GESUCHT: {item.query}</small>
            <h3>{item.result.title}</h3>
            <p>{item.result.artist}</p>
            <span>{item.result.album}</span>
          </div>
          <a className="open" href={item.result.url} target="_blank" rel="noreferrer">Auf Spotify öffnen <ExternalLink size={15}/></a>
        </article> : <article className="song notfound" key={i}>
          <AlertCircle/><div><b>{item.query}</b><span>{item.error || "Kein passender Track gefunden."}</span></div>
        </article>)}
      </section>}

      {!searched && <div className="steps">
        <div><b>01</b>Songtitel + Künstler einfügen</div>
        <div><b>02</b>Spotify-Katalog durchsuchen</div>
        <div><b>03</b>Direkten Link öffnen</div>
      </div>}
    </main>
    <footer>Spotify Song Finder · Spotify Web API</footer>
  </div>;
}

createRoot(document.getElementById("root")).render(<App />);
