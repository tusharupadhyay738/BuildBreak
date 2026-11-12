---
mode: testing
max_steps: 50
timeout: 180
target: chrome
---

# Session: ArenaDashboardBaseline

## Step 1
Verify the BuildBreak Arena page shows a historical human-triggered discount regression: before repair failed with subtotal 39.98, expected total 35.98 and actual total 37.98; after repair passed with actual total 35.98. Verify the baseline, seeded fault, repair, evidence availability and verification limits are visible.
