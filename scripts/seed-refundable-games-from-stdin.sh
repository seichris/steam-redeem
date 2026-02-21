#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"
SEED_SCRIPT="${ROOT_DIR}/scripts/seed-refundable-games.js"

usage() {
  cat <<'EOF'
Usage:
  cat games.json | ./scripts/seed-refundable-games-from-stdin.sh [--dry-run]
  ./scripts/seed-refundable-games-from-stdin.sh --file=/path/to/games.json [--dry-run]

Notes:
  - Uses scripts/seed-refundable-games.js for normalization + upsert.
  - Requires DATABASE_URL unless --dry-run is used.
  - Supports DATABASE_SSL=true for managed Postgres endpoints.
EOF
}

if [[ ! -f "${SEED_SCRIPT}" ]]; then
  echo "Missing seed script: ${SEED_SCRIPT}" >&2
  exit 1
fi

json_file=""
dry_run="false"
pass_through=()

for arg in "$@"; do
  case "$arg" in
    --file=*)
      json_file="${arg#--file=}"
      ;;
    --dry-run)
      dry_run="true"
      pass_through+=("$arg")
      ;;
    --help|-h)
      usage
      exit 0
      ;;
    *)
      pass_through+=("$arg")
      ;;
  esac
done

if [[ -z "${json_file}" ]]; then
  if [[ -t 0 ]]; then
    usage >&2
    exit 1
  fi

  json_file="$(mktemp "${TMPDIR:-/tmp}/refundable-games.XXXXXX.json")"
  trap 'rm -f "$json_file"' EXIT
  cat > "${json_file}"
fi

if [[ ! -s "${json_file}" ]]; then
  echo "Input JSON is empty: ${json_file}" >&2
  exit 1
fi

if [[ "${dry_run}" != "true" ]] && [[ -z "${DATABASE_URL:-}" ]]; then
  echo "DATABASE_URL is required (or run with --dry-run)." >&2
  exit 1
fi

node "${SEED_SCRIPT}" --file="${json_file}" "${pass_through[@]}"
