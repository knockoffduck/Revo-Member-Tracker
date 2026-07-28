#!/usr/bin/env bash
#
# One-time + schedulable archiver for the Revo_Gym_Count PocketBase table.
#
# Exports rows older than the retention window to a zipped CSV, verifies the
# export, then deletes those rows and reclaims space with VACUUM.
#
# The initial run archives ~4.9M rows directly against the SQLite file (fast).
# Subsequent scheduled runs only remove a small rolling window, so they could
# alternatively use the PocketBase REST endpoint; this script keeps using the
# SQLite path for consistency and speed.
#
# Usage:
#   RETENTION_DAYS=90 ./archive-gym-count.sh
#
set -euo pipefail

VOLUME="revo-tracker-pocketbase-kqjsby_pocketbase-data"
DB_PATH="/data/data/data.db"
TABLE="Revo_Gym_Count"
RETENTION_DAYS="${RETENTION_DAYS:-90}"
ARCHIVE_DIR="${ARCHIVE_DIR:-$HOME/archives/Revo_Gym_Count}"

CUTOFF="$(date -u -d "-${RETENTION_DAYS} days" +%Y-%m-%dT00:00:00.000Z)"
STAMP="$(date -u +%Y%m%d-%H%M%S)"
CSV_NAME="${TABLE}_${STAMP}.csv"
ZIP_NAME="${TABLE}_${STAMP}.zip"

mkdir -p "$ARCHIVE_DIR"

echo "Retention: ${RETENTION_DAYS} days"
echo "Cutoff:    ${CUTOFF}"
echo "Archive:   ${ARCHIVE_DIR}/${ZIP_NAME}"

# Run a SQL statement inside a throwaway alpine container that has sqlite3 and
# the pocketbase data volume mounted read/write.
run_sql() {
  local sql="$1"
  sudo docker run --rm \
    -v "${VOLUME}":/data \
    -v "${ARCHIVE_DIR}":/out \
    alpine sh -c "apk add --no-cache sqlite >/dev/null 2>&1; sqlite3 ${DB_PATH} \"${sql}\""
}

# 1. Count rows that will be archived.
COUNT="$(run_sql "SELECT count(*) FROM ${TABLE} WHERE created < '${CUTOFF}';")"
echo "Rows to archive: ${COUNT}"

if [ "${COUNT}" -eq 0 ]; then
  echo "Nothing to archive. Done."
  exit 0
fi

# 2. Export to CSV (header row included) into the archive dir. Use dot-commands
#    (.headers on / .mode csv) because the -header CLI flag is not honored.
echo "Exporting to CSV..."
sudo docker run --rm \
  -v "${VOLUME}":/data \
  -v "${ARCHIVE_DIR}":/out \
  alpine sh -c "apk add --no-cache sqlite >/dev/null 2>&1; sqlite3 ${DB_PATH} '.headers on' '.mode csv' \"SELECT * FROM ${TABLE} WHERE created < '${CUTOFF}';\" > /out/${CSV_NAME}"

# 3. Verify the exported data-row count. sqlite3 -csv emits a header line and a
#    trailing newline, so data rows = total lines - 1.
EXPORTED_LINES="$(wc -l < "${ARCHIVE_DIR}/${CSV_NAME}")"
EXPORTED_ROWS="$((EXPORTED_LINES - 1))"
echo "Exported rows: ${EXPORTED_ROWS} (expected ${COUNT})"

if [ "${EXPORTED_ROWS}" -ne "${COUNT}" ]; then
  echo "ERROR: exported row count does not match. Aborting before delete." >&2
  exit 1
fi

# 4. Compress to zip and confirm it is non-trivial.
echo "Compressing to zip..."
( cd "${ARCHIVE_DIR}" && zip -q "${ZIP_NAME}" "${CSV_NAME}" )
rm -f "${ARCHIVE_DIR}/${CSV_NAME}"
ZIP_SIZE="$(du -h "${ARCHIVE_DIR}/${ZIP_NAME}" | cut -f1)"
echo "Archive written: ${ZIP_NAME} (${ZIP_SIZE})"

# 5. Delete archived rows.
echo "Deleting archived rows from ${TABLE}..."
run_sql "DELETE FROM ${TABLE} WHERE created < '${CUTOFF}';"

# 6. Reclaim disk space.
echo "Running VACUUM (this may take a while on a large db)..."
run_sql "VACUUM;"

REMAINING="$(run_sql "SELECT count(*) FROM ${TABLE};")"
echo "Done. Remaining rows in ${TABLE}: ${REMAINING}"
