#!/usr/bin/env bash
set -euo pipefail
: > /tmp/drawforge-burnin-50.log
for i in $(seq 1 50); do
  echo "=== RUN $i ===" >> /tmp/drawforge-burnin-50.log
  if env BURNIN_RUNS=1 BURNIN_MAX_STEPS=120 BURNIN_RUN_TIMEOUT_MS=35000 node tests/playwright-burnin.js >> /tmp/drawforge-burnin-50.log 2>&1; then
    :
  else
    status=$?
    echo "[HARNESS_EXIT] run $i exit=$status" >> /tmp/drawforge-burnin-50.log
  fi
  echo >> /tmp/drawforge-burnin-50.log
done
