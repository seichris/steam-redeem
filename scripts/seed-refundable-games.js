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

function normalizeConfidence(raw) {
  if (typeof raw !== "number" || Number.isNaN(raw)) return null;
  const normalized = raw > 1 ? raw / 100 : raw;
  if (normalized < 0 || normalized > 1) return null;
  return normalized;
}

function pickSourceUrl(sources) {
  if (!Array.isArray(sources) || sources.length === 0) {
    return "manual-import";
  }
  const primary = sources.find((s) => s && s.primary === true && typeof s.url === "string");
  if (primary) return primary.url;
  const first = sources.find((s) => s && typeof s.url === "string");
  return first?.url ?? "manual-import";
}

function buildReason(entry) {
  const parts = [];
  if (typeof entry.delivery_gap_summary === "string" && entry.delivery_gap_summary.trim()) {
    parts.push(entry.delivery_gap_summary.trim());
  }
  if (typeof entry.evidence_strength === "string" && entry.evidence_strength.trim()) {
    parts.push(`Evidence: ${entry.evidence_strength.trim()}.`);
  }
  if (typeof entry.status === "string" && entry.status.trim()) {
    parts.push(`Status: ${entry.status.trim()}.`);
  }
  if (typeof entry.company === "string" && entry.company.trim()) {
    parts.push(`Company: ${entry.company.trim()}.`);
  }
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
  const skipped = [];

  for (const entry of entries) {
    const game = typeof entry?.game === "string" ? entry.game : "Unknown Game";
    const appId = entry?.appId;
    if (!Number.isInteger(appId) || appId <= 0) {
      skipped.push({ game, reason: "missing_or_invalid_app_id" });
      continue;
    }

    const confidence = normalizeConfidence(entry?.confidence);
    if (confidence === null) {
      skipped.push({ game, reason: "invalid_confidence" });
      continue;
    }

    const reason = buildReason(entry);
    if (!reason) {
      skipped.push({ game, reason: "missing_reason" });
      continue;
    }

    prepared.push({
      game,
      appId,
      reason,
      confidence,
      source: pickSourceUrl(entry?.sources)
    });
  }

  console.log(`prepared rows: ${prepared.length}`);
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
