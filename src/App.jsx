import { useState } from "react";
import axios from "axios";

export default function App() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  const handleAnalyze = async (e) => {
    e.preventDefault();
    setError("");
    setResult(null);
    setLoading(true);

    try {
      const res = await axios.post("http://localhost:4000/api/seo-check", {
        url,
      });
      setResult(res.data);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to analyze website");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white text-slate-900 flex flex-col">
      {/* HEADER */}
      <header className="flex items-center justify-between px-10 py-5 border-b border-slate-200 shadow-sm">
        <span className="font-extrabold text-2xl text-slate-900 tracking-tight">
          SEOptimer
        </span>
      </header>

      {/* HERO SECTION */}
      <main className="flex flex-col items-center text-center py-24 px-4">
        <h1 className="text-5xl sm:text-6xl font-extrabold tracking-tight text-slate-900 leading-tight">
          SEO Audit & Reporting Tool
        </h1>

        <div className="w-56 h-[6px] bg-yellow-400 rounded-full mt-3"></div>

        <p className="text-2xl sm:text-3xl font-medium text-slate-700 mt-6">
          + Comprehensive SEO Toolset
        </p>

        {/* URL BAR */}
        <form
          onSubmit={handleAnalyze}
          className="flex items-center mt-10 border border-slate-300 rounded-2xl overflow-hidden shadow-lg max-w-xl w-full bg-white"
        >
          <input
            type="url"
            placeholder="Example.com"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className="flex-1 px-5 py-3 text-slate-800 text-lg outline-none bg-white"
            required
          />

          <button
            type="submit"
            disabled={loading}
            className="px-10 py-3 bg-yellow-400 hover:bg-yellow-500 text-black font-semibold text-lg transition disabled:opacity-60"
          >
            {loading ? "Auditing..." : "Audit"}
          </button>
        </form>

        <p className="text-slate-500 mt-3 text-sm">
          Enter a URL address and get a Free Website Analysis!
        </p>

        {error && (
          <p className="text-red-600 mt-4 text-sm font-medium">{error}</p>
        )}

        {/* RESULT SECTION */}
        {result && <AuditResult result={result} />}
      </main>

      {/* WHY SECTION */}
      <section className="bg-[#F2F7FA] w-full py-24 px-6 border-t border-slate-200">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-extrabold text-slate-900 mb-10 tracking-tight">
            Why SEOoptimer?
          </h2>

          <p className="text-slate-700 leading-8 text-lg mb-8">
            Getting your website to rank in Google is harder and more
            competitive than ever. There are many factors such as on page
            content, performance, social factors and backlink profile that
            search engines like Google use to determine which sites should rank
            highest.
          </p>

          <p className="text-slate-700 leading-8 text-lg">
            SEOoptimer is a free SEO Audit Tool that performs a detailed SEO
            analysis across 100 website data points and provides clear,
            actionable recommendations you can follow to improve your online
            visibility, search performance and digital presence.
          </p>
        </div>
      </section>

      {/* FOOTER */}
      <Footer />
    </div>
  );
}

/* ------------------ AUDIT RESULT COMPONENT ------------------ */
function AuditResult({ result }) {
  return (
    <div className="mt-20 w-full max-w-4xl mx-auto px-4">
      <h2 className="text-4xl font-extrabold text-slate-900 text-center mb-12">
        Audit Result
      </h2>

      {/* SCORE CIRCLE */}
      <div className="flex justify-center mb-12">
        <div className="w-40 h-40 bg-white shadow-lg rounded-full border-4 border-yellow-400 flex flex-col items-center justify-center">
          <span className="text-5xl font-extrabold text-slate-900">
            {result.metrics.scores.overall}
          </span>
          <span className="text-slate-600 font-medium mt-1">Overall Score</span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-16">
        <ScoreCard
          label="Performance"
          value={result.metrics.scores.performance}
          color="blue"
        />
        <ScoreCard
          label="SEO"
          value={result.metrics.scores.seo}
          color="green"
        />
        <ScoreCard
          label="Overall"
          value={result.metrics.scores.overall}
          color="yellow"
        />
      </div>

      {/* SEO DETAILS */}
      <div className="bg-white border border-slate-200 rounded-xl p-8 shadow mb-16">
        <h3 className="text-2xl font-bold text-slate-900 mb-6">SEO Details</h3>

        <DetailRow label="Title" value={result.metrics.seoDetails.title} />
        <DetailRow
          label="Meta Description"
          value={result.metrics.seoDetails.metaDescription}
        />
        <DetailRow label="H1 Heading" value={result.metrics.seoDetails.h1} />
        <DetailRow
          label="Images Without Alt"
          value={`${result.metrics.seoDetails.imgWithoutAlt} / ${result.metrics.seoDetails.imgCount}`}
        />
        <DetailRow
          label="Canonical URL"
          value={result.metrics.seoDetails.canonical}
        />
        <DetailRow
          label="Robots Meta"
          value={result.metrics.seoDetails.robotsMeta}
        />
      </div>

      {/* AI SUGGESTIONS */}
      <div className="bg-[#F5F8FA] border border-slate-300 rounded-xl p-8 shadow mb-20">
        <h3 className="text-2xl font-bold text-slate-900 mb-4">
          AI Recommendations
        </h3>

        <div className="text-slate-700 leading-relaxed whitespace-pre-wrap">
          {result.ai.explanation}
        </div>
      </div>
    </div>
  );
}

/* ------------------ SCORE CARD ------------------ */
function ScoreCard({ label, value, color }) {
  const colors = {
    blue: "border-blue-500 text-blue-600",
    green: "border-green-500 text-green-600",
    yellow: "border-yellow-500 text-yellow-600",
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-6 shadow flex flex-col items-center">
      <span className="text-sm text-slate-500">{label}</span>
      <span className={`text-4xl font-bold mt-2 ${colors[color]}`}>
        {value}
      </span>
    </div>
  );
}

/* ------------------ SEO DETAIL ROW ------------------ */
function DetailRow({ label, value }) {
  return (
    <div className="flex flex-col sm:flex-row gap-2 text-sm mb-4">
      <span className="w-48 font-semibold text-slate-700">{label}</span>
      <span className="text-slate-800">{value}</span>
    </div>
  );
}

/* ------------------ FOOTER ------------------ */
function Footer() {
  return (
    <footer className="w-full bg-[#0B2239] text-white mt-20 py-16">
      <div className="w-full max-w-[1600px] mx-auto px-10 grid grid-cols-1 sm:grid-cols-4 gap-10">
        <div>
          <h3 className="text-3xl font-extrabold tracking-tight mb-4">
            SEOptimer
          </h3>
          <button className="px-6 py-2 border border-white rounded-lg hover:bg-white hover:text-[#0B2239] transition mb-4">
            Contact us
          </button>
          <p className="text-sm text-slate-300 leading-relaxed">
            SEOptimer
            <br />
            Greater Noida
          </p>
        </div>

        <div>
          <h4 className="font-semibold text-lg mb-4">FEATURES</h4>
          <ul className="space-y-2 text-sm text-slate-300">
            <li>Website Audit</li>
            <li>Ranking Monitoring</li>
            <li>Backlink Monitoring</li>
            <li>Keyword Research</li>
            <li>Uptime Monitoring</li>
          </ul>
        </div>

        <div>
          <h4 className="font-semibold text-lg mb-4">FREE SEO TOOLS</h4>
          <ul className="space-y-2 text-sm text-slate-300">
            <li>SEO Checker</li>
            <li>Ranking Checker</li>
            <li>Backlink Checker</li>
            <li>Keyword Research Tool</li>
            <li>TF•IDF Tool</li>
          </ul>
        </div>

        <div>
          <h4 className="font-semibold text-lg mb-4">LEGAL</h4>
          <ul className="space-y-2 text-sm text-slate-300">
            <li>Terms & Conditions</li>
            <li>Privacy</li>
            <li>Imprint</li>
          </ul>
        </div>
      </div>

      <div className="mt-12 text-center text-slate-400 text-sm">
        © 2025 SEOptimer — All Rights Reserved.
      </div>
    </footer>
  );
}
