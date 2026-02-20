const fs = require("node:fs/promises");
const path = require("node:path");
const { Client } = require("pg");

function getDatabaseUrlOrThrow() {
  const value = process.env.DATABASE_URL;
  if (!value) {
    throw new Error("Missing DATABASE_URL");
  }
  return value;
}

function getSslConfig() {
  if (process.env.DATABASE_SSL === "true") {
    return { rejectUnauthorized: false };
  }
  return undefined;
}

function getArgValue(name, defaultValue) {
  const prefix = `--${name}=`;
  const arg = process.argv.find((item) => item.startsWith(prefix));
  if (!arg) return defaultValue;
  return arg.slice(prefix.length);
}

function hasFlag(name) {
  return process.argv.includes(`--${name}`);
}

function isUndefinedTableError(error) {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "42P01"
  );
}

function normalizeConfidence(raw) {
  if (typeof raw !== "number" || Number.isNaN(raw)) return null;
  const normalized = raw > 1 ? raw / 100 : raw;
  if (normalized < 0 || normalized > 1) return null;
  return normalized;
}

function normalizeText(raw, fallback) {
  if (typeof raw === "string" && raw.trim()) return raw.trim();
  return fallback;
}

function normalizeStringList(raw) {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((item) => typeof item === "string" && item.trim())
    .map((item) => item.trim());
}

function normalizeSources(raw) {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((item) => item && typeof item === "object")
    .map((item) => {
      const source = item;
      return {
        url: typeof source.url === "string" ? source.url : "",
        published_date:
          typeof source.published_date === "string" ? source.published_date : "unknown",
        accessed_date:
          typeof source.accessed_date === "string" ? source.accessed_date : "unknown",
        primary: source.primary === true
      };
    })
    .filter((item) => item.url);
}

function pickSourceUrl(sources) {
  if (sources.length === 0) {
    return "manual-import";
  }
  const primary = sources.find((s) => s.primary === true && typeof s.url === "string");
  if (primary) return primary.url;
  const first = sources.find((s) => typeof s.url === "string");
  return first?.url ?? "manual-import";
}

function extractSteamAppIdFromUrl(rawUrl) {
  if (typeof rawUrl !== "string") return null;
  const match = rawUrl.match(
    /(?:store\.steampowered\.com\/(?:app|news\/app)\/|steamcommunity\.com\/(?:app|games)\/)(\d+)/i
  );
  if (!match) return null;
  const appId = Number(match[1]);
  if (!Number.isInteger(appId) || appId <= 0) return null;
  return appId;
}

function inferSteamAppId(entry, sources) {
  const explicitCandidates = [entry?.appId, entry?.steamAppId, entry?.steam_app_id];
  for (const candidate of explicitCandidates) {
    if (Number.isInteger(candidate) && candidate > 0) return candidate;
  }

  for (const source of sources) {
    const inferred = extractSteamAppIdFromUrl(source.url);
    if (inferred) return inferred;
  }

  return null;
}

function createSlug(raw) {
  return raw
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^\x00-\x7F]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");
}

function buildReason(entry, company, evidenceStrength, status) {
  const parts = [];
  if (typeof entry.delivery_gap_summary === "string" && entry.delivery_gap_summary.trim()) {
    parts.push(entry.delivery_gap_summary.trim());
  }
  parts.push(`Evidence: ${evidenceStrength}.`);
  parts.push(`Status: ${status}.`);
  parts.push(`Company: ${company}.`);
  return parts.join(" ").trim();
}

async function run() {
  const seedPath = getArgValue(
    "file",
    path.join(process.cwd(), "db", "seeds", "refundable-games.json")
  );
  const dryRun = hasFlag("dry-run");

  const raw = await fs.readFile(seedPath, "utf8");
  const entries = JSON.parse(raw);
  if (!Array.isArray(entries)) {
    throw new Error("Seed file must be a JSON array.");
  }

  const prepared = [];
  const legacyByAppId = new Map();
  const skipped = [];
  const slugCounts = new Map();

  for (let index = 0; index < entries.length; index += 1) {
    const entry = entries[index];
    const game = normalizeText(entry?.game, `Unknown Game ${index + 1}`);
    const slugBase = createSlug(game) || `entry-${index + 1}`;
    const existingCount = slugCounts.get(slugBase) ?? 0;
    slugCounts.set(slugBase, existingCount + 1);
    const slug = existingCount > 0 ? `${slugBase}-${existingCount + 1}` : slugBase;

    const confidence = normalizeConfidence(entry?.confidence);
    if (confidence === null) {
      skipped.push({ game, reason: "invalid_confidence" });
      continue;
    }

    const company = normalizeText(entry?.company, "Unknown company");
    const promiseSummary = normalizeText(
      entry?.promise_summary,
      "[Inference] Consumer expectations were formed by how the game was sold and marketed."
    );
    const deliveryGapSummary = normalizeText(
      entry?.delivery_gap_summary,
      "[Fact] Delivery gap details were not captured in the source set."
    );
    const usRelevance = normalizeText(
      entry?.us_relevance,
      "US relevance not specified in captured sources."
    );
    const evidenceStrength = normalizeText(entry?.evidence_strength, "unknown");
    const status = normalizeText(entry?.status, "candidate");
    const refundSignals = normalizeStringList(entry?.refund_signal);
    const sources = normalizeSources(entry?.sources);
    const source = pickSourceUrl(sources);
    const steamAppId = inferSteamAppId(entry, sources);
    const reason = buildReason(entry, company, evidenceStrength, status);

    prepared.push({
      slug,
      game,
      company,
      steamAppId,
      promiseSummary,
      deliveryGapSummary,
      usRelevance,
      evidenceStrength,
      confidence,
      status,
      refundSignals,
      sources
    });

    if (steamAppId) {
      const existing = legacyByAppId.get(steamAppId);
      const candidate = { appId: steamAppId, reason, confidence, source };
      if (!existing || candidate.confidence >= existing.confidence) {
        legacyByAppId.set(steamAppId, candidate);
      }
    }
  }

  const legacyPrepared = Array.from(legacyByAppId.values());

  console.log(`prepared rows: ${prepared.length}`);
  console.log(`prepared Steam match rows: ${legacyPrepared.length}`);
  console.log(`skipped rows: ${skipped.length}`);
  if (skipped.length > 0) {
    for (const item of skipped) {
      console.log(`skip ${item.game}: ${item.reason}`);
    }
  }

  if (dryRun) {
    return;
  }

  const client = new Client({
    connectionString: getDatabaseUrlOrThrow(),
    ssl: getSslConfig()
  });

  await client.connect();
  try {
    await client.query("begin");

    for (const row of prepared) {
      await client.query(
        `
          insert into refundable_catalog_games (
            slug,
            game,
            company,
            steam_app_id,
            promise_summary,
            delivery_gap_summary,
            us_relevance,
            evidence_strength,
            confidence,
            status,
            refund_signal,
            sources
          )
          values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12::jsonb)
          on conflict (slug) do update
          set game = excluded.game,
              company = excluded.company,
              steam_app_id = excluded.steam_app_id,
              promise_summary = excluded.promise_summary,
              delivery_gap_summary = excluded.delivery_gap_summary,
              us_relevance = excluded.us_relevance,
              evidence_strength = excluded.evidence_strength,
              confidence = excluded.confidence,
              status = excluded.status,
              refund_signal = excluded.refund_signal,
              sources = excluded.sources,
              updated_at = now()
        `,
        [
          row.slug,
          row.game,
          row.company,
          row.steamAppId,
          row.promiseSummary,
          row.deliveryGapSummary,
          row.usRelevance,
          row.evidenceStrength,
          row.confidence,
          row.status,
          row.refundSignals,
          JSON.stringify(row.sources)
        ]
      );
    }

    try {
      for (const row of legacyPrepared) {
        await client.query(
          `
            insert into refundable_games (app_id, reason, confidence, source)
            values ($1, $2, $3, $4)
            on conflict (app_id) do update
            set reason = excluded.reason,
                confidence = excluded.confidence,
                source = excluded.source,
                updated_at = now()
          `,
          [row.appId, row.reason, row.confidence, row.source]
        );
      }
    } catch (error) {
      if (!isUndefinedTableError(error)) throw error;
      console.warn("warning: table refundable_games does not exist; skipped legacy Steam mapping seed");
    }

    await client.query("commit");
  } catch (error) {
    await client.query("rollback");
    throw error;
  } finally {
    await client.end();
  }

  console.log("seed completed");
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
