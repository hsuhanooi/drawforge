#!/bin/bash

# ralph.sh - Automated Claude agent for Flappy Bird development
# Usage: ./plans/ralph.sh [iterations]  (default: 10)
#
# Environment variables:
#   TELEGRAM_BOT_TOKEN - Your Telegram bot token (optional)
#   TELEGRAM_CHAT_ID   - Your Telegram chat ID (optional)
#   ANTHROPIC_API_KEY  - Required for quota check

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Telegram notification function
send_telegram() {
    local message="$1"
    if [ -n "$TELEGRAM_BOT_TOKEN" ] && [ -n "$TELEGRAM_CHAT_ID" ]; then
        curl -s -X POST "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage" \
            -d chat_id="$TELEGRAM_CHAT_ID" \
            -d text="$message" \
            -d parse_mode="HTML" > /dev/null 2>&1 || true
    fi
}

# Function to get and display quota/usage
show_quota() {
    if [ -n "$ANTHROPIC_API_KEY" ]; then
        echo -e "${CYAN}----------------------------------------${NC}"
        echo -e "${CYAN}  Checking API Usage...${NC}"
        echo -e "${CYAN}----------------------------------------${NC}"

        # Try to get usage info from Anthropic API
        USAGE_RESPONSE=$(curl -s -w "\n%{http_code}" "https://api.anthropic.com/v1/usage" \
            -H "x-api-key: $ANTHROPIC_API_KEY" \
            -H "anthropic-version: 2023-06-01" 2>/dev/null || echo "error")

        HTTP_CODE=$(echo "$USAGE_RESPONSE" | tail -n1)
        BODY=$(echo "$USAGE_RESPONSE" | sed '$d')

        if [ "$HTTP_CODE" = "200" ]; then
            echo -e "${GREEN}Usage data retrieved successfully${NC}"
            echo "$BODY" | python3 -m json.tool 2>/dev/null || echo "$BODY"
        else
            # Fallback: show a note about checking usage manually
            echo -e "${YELLOW}Note: Check your usage at https://console.anthropic.com/settings/usage${NC}"
        fi
        echo ""
    fi
}

# Set iterations (default to 10 if not provided)
ITERATIONS=${1:-10}
PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
TEMP_OUTPUT=$(mktemp)

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  Ralph - Flappy Bird Development Agent${NC}"
echo -e "${BLUE}========================================${NC}"
echo -e "Project directory: ${PROJECT_DIR}"
echo -e "Planned iterations: ${ITERATIONS}"

# Show configuration status
if [ -n "$TELEGRAM_BOT_TOKEN" ] && [ -n "$TELEGRAM_CHAT_ID" ]; then
    echo -e "Telegram notifications: ${GREEN}Enabled${NC}"
else
    echo -e "Telegram notifications: ${YELLOW}Disabled${NC} (set TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID to enable)"
fi

if [ -n "$ANTHROPIC_API_KEY" ]; then
    echo -e "Quota display: ${GREEN}Enabled${NC}"
else
    echo -e "Quota display: ${YELLOW}Disabled${NC} (set ANTHROPIC_API_KEY to enable)"
fi
echo ""

# The prompt for Claude
PROMPT='You are working on a Flappy Bird browser game project. Your task is to implement features from the PRD.

INSTRUCTIONS:
1. Read @prd.json to see all features and their status
2. Read @progress.txt to see current progress
3. Find the NEXT feature where "passes": false (in priority order). This should be the one YOU decide has the highest priority order - not necessarily the first item.
4. Run the test suite first and fix any broken tests. DO NOT JUST SKIP OVER BROKEN TESTS BECAUSE THEY ARE PRE-EXISTING. TRY TO FIX THEM OR FIGURE OUT WHAT IS WRONG BEFORE STARTING SOMETHING NEW.
5. Implement that feature completely:
   - Write/modify the necessary code files
   - Write unit tests for the feature (in tests/ directory using Jest)
   - Update prd.json to set "passes": true for the completed feature
   - Append a progress update to progress.txt with what you did and leave a note for the next person working in the codebase.
6. Run tests to verify your implementation:
   - Run "npm test" for Jest unit tests
   - For visual/browser features, use Puppeteer MCP tools to test in browser but only use this if it calls for it in the PRD. We only run this once every 10 tasks:
     a. Start local server: "npx serve -p 3000 &" (if not already running)
     b. Use mcp__puppeteer__browser_navigate to go to http://localhost:3000
     c. Use mcp__puppeteer__browser_screenshot to verify visual rendering
     d. Use mcp__puppeteer__browser_click or browser_type for interaction tests
7. Make a git commit of that feature. ONLY WORK ON ONE FEATURE.
8. If while implementing the feature, you notice the PRD is complete, output <promise>COMPLETE</promise>

IMPORTANT RULES:
- Only implement ONE feature per iteration
- Always write tests for your implementation
- Update both prd.json and progress.txt after completing a feature
- Keep code simple and focused
- For visual features (rendering, styling), verify with browser screenshot

BROWSER TESTING (via Puppeteer MCP):
- mcp__puppeteer__browser_navigate: Navigate to URL
- mcp__puppeteer__browser_screenshot: Take screenshot to verify visuals
- mcp__puppeteer__browser_click: Click elements (use for flap testing)
- mcp__puppeteer__browser_console_messages: Check for JS errors

COMPLETION CHECK:
After implementing, check if ALL features in prd.json have "passes": true.
- If there are still features with "passes": false, end your response normally
- If ALL features have "passes": true (project complete), you MUST end your response with exactly:
  <promise>COMPLETE</promise>

Now read the PRD and progress files, then implement the next incomplete feature.'

# Cleanup function
cleanup() {
    rm -f "$TEMP_OUTPUT"
}
trap cleanup EXIT

# Send start notification
send_telegram "🚀 <b>Ralph Started</b>%0AProject: Flappy Bird%0AIterations: $ITERATIONS"

# Run the loop
for ((i=1; i<=ITERATIONS; i++)); do
    echo -e "${YELLOW}========================================${NC}"
    echo -e "${YELLOW}  Iteration $i of $ITERATIONS${NC}"
    echo -e "${YELLOW}========================================${NC}"
    echo ""
    echo -e "${BLUE}Running Claude... (streaming output in real-time)${NC}"
    echo -e "${CYAN}----------------------------------------${NC}"
    echo ""

    # Run Claude with real-time output streaming using tee
    # This shows output as it happens AND captures it for completion check
    cd "$PROJECT_DIR" && claude --dangerously-skip-permissions --print "$PROMPT" 2>&1 | tee "$TEMP_OUTPUT"

    echo ""
    echo -e "${CYAN}----------------------------------------${NC}"

    # Read captured output for completion check
    OUTPUT=$(cat "$TEMP_OUTPUT")

    # Show quota/usage after each iteration
    show_quota

    # Check for completion marker
    if echo "$OUTPUT" | grep -q "<promise>COMPLETE</promise>"; then
        echo -e "${GREEN}========================================${NC}"
        echo -e "${GREEN}  PROJECT COMPLETE!${NC}"
        echo -e "${GREEN}========================================${NC}"
        echo -e "All features have been implemented."
        echo -e "Total iterations used: $i"
        send_telegram "✅ <b>Ralph Complete!</b>%0AProject: Flappy Bird%0A<b>All features implemented!</b>%0AIterations used: $i"
        exit 0
    fi

    echo -e "${BLUE}Iteration $i complete. Moving to next...${NC}"
    echo ""

    # Small delay between iterations
    sleep 2
done

echo -e "${YELLOW}========================================${NC}"
echo -e "${YELLOW}  Iterations Complete${NC}"
echo -e "${YELLOW}========================================${NC}"
echo -e "Completed $ITERATIONS iterations."
echo -e "Project may not be fully complete - check progress.txt for status."

# Send completion notification
send_telegram "⏹️ <b>Ralph Finished</b>%0AProject: Flappy Bird%0ACompleted $ITERATIONS iterations%0ANote: Project may not be fully complete"

exit 0
