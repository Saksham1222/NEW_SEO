import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import fetch from "node-fetch";
import * as cheerio from "cheerio";
import OpenAI from "openai";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 4000;

// Validate keys early
if (!process.env.OPENAI_API_KEY) {
  console.error("❌ Missing OPENAI_API_KEY in .env");
}
if (!process.env.PAGESPEED_API_KEY) {
  console.warn("⚠️ Missing PAGESPEED_API_KEY — PageSpeed scores may fail.");
}

// OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Health check route
app.get("/", (req, res) => {
  res.send("SEO + AI backend is running ✅");
});

// Main SEO check route
app.post("/api/seo-check", async (req, res) => {
  try {
    const { url } = req.body;

    // 1) Validate URL input
    if (!url || !url.startsWith("http")) {
      return res.status(400).json({
        error: "Please send a valid URL starting with http or https",
      });
    }

    // 2) PageSpeed API
    let performanceScore = 0;
    let psiJson = {};

    try {
      const psiUrl = new URL(
        "https://www.googleapis.com/pagespeedonline/v5/runPagespeed"
      );
      psiUrl.searchParams.set("url", url);
      psiUrl.searchParams.set("strategy", "mobile");

      if (process.env.PAGESPEED_API_KEY) {
        psiUrl.searchParams.set("key", process.env.PAGESPEED_API_KEY);
      }

      const psiRes = await fetch(psiUrl.toString());
      psiJson = await psiRes.json();

      const lighthouseScore =
        psiJson.lighthouseResult?.categories?.performance?.score;

      performanceScore = lighthouseScore
        ? Math.round(lighthouseScore * 100)
        : 0;
    } catch (e) {
      console.warn("PageSpeed API failed → Continuing without it.");
    }

    // 3) Fetch HTML
    const htmlRes = await fetch(url);
    const html = await htmlRes.text();
    const $ = cheerio.load(html);

    // 4) Extract SEO tags
    const title = $("title").text().trim() || "";
    const metaDescription =
      $('meta[name="description"]').attr("content") || "";
    const h1 = $("h1").first().text().trim() || "";
    const imgCount = $("img").length;
    const imgWithoutAlt = $("img:not([alt]), img[alt='']").length;
    const canonical = $('link[rel="canonical"]').attr("href") || "";
    const robotsMeta = $('meta[name="robots"]').attr("content") || "";

    // 5) SEO scoring
    const seoScorePieces = [];

    if (title.length >= 10 && title.length <= 60) seoScorePieces.push(25);
    if (metaDescription.length >= 50 && metaDescription.length <= 160)
      seoScorePieces.push(25);
    if (h1.length > 0) seoScorePieces.push(25);
    if (imgCount > 0 && imgWithoutAlt / imgCount < 0.3)
      seoScorePieces.push(25);

    const seoScore =
      seoScorePieces.length > 0
        ? seoScorePieces.reduce((a, b) => a + b, 0)
        : 40;

    const overallScore = Math.round(
      performanceScore * 0.5 + seoScore * 0.5
    );

    // 6) Prepare metrics object
    const metrics = {
      url,
      scores: {
        overall: overallScore,
        performance: performanceScore,
        seo: seoScore,
      },
      seoDetails: {
        title,
        metaDescription,
        h1,
        imgCount,
        imgWithoutAlt,
        canonical,
        robotsMeta,
      },
    };

    // 7) Ask AI for explanation (Fix for GPT API format)
    const completion = await openai.responses.create({
      model: "gpt-4o-mini",
      input: [
        {
          role: "system",
          content:
            "You are an SEO and performance expert. Explain issues clearly for beginners and give practical steps.",
        },
        {
          role: "user",
          content:
            "Here are website metrics. 1) Explain what is good/bad. " +
            "2) Give actionable fixes. 3) Suggest improved title & meta description.\n\n" +
            JSON.stringify(metrics),
        },
      ],
    });

    const aiText = completion.output_text || "AI response not available.";

    // 8) Send final response
    res.json({
      metrics,
      ai: { explanation: aiText },
    });
  } catch (err) {
    console.error("❌ SERVER ERROR:", err);

    // Rate limit handling
    if (err.code === "insufficient_quota" || err.status === 429) {
      return res.status(429).json({
        error:
          "Your OpenAI API quota has been exceeded. Please upgrade the plan or use a new API key.",
      });
    }

    res.status(500).json({
      error: "Something went wrong while analyzing the site.",
    });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
