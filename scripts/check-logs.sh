#!/bin/bash

# Check logs script for Webexp automation
# Usage: ./scripts/check-logs.sh [component] [lines]

COMPONENT=${1:-"all"}
LINES=${2:-50}

echo "🔍 Checking logs for component: $COMPONENT (last $LINES lines)"
echo "=================================================="

if [ "$COMPONENT" = "all" ]; then
    echo "📋 Capture Logs:"
    if [ -f "logs/capture-$(date +%Y-%m-%d).log" ]; then
        tail -n $LINES "logs/capture-$(date +%Y-%m-%d).log"
    else
        echo "No capture logs found for today"
    fi
    
    echo -e "\n🧠 Semantic Logs:"
    if [ -f "logs/semantic-$(date +%Y-%m-%d).log" ]; then
        tail -n $LINES "logs/semantic-$(date +%Y-%m-%d).log"
    else
        echo "No semantic logs found for today"
    fi
    
    echo -e "\n🌐 API Logs:"
    if [ -f "logs/api-$(date +%Y-%m-%d).log" ]; then
        tail -n $LINES "logs/api-$(date +%Y-%m-%d).log"
    else
        echo "No API logs found for today"
    fi
    
    echo -e "\n📝 General Logs:"
    if [ -f "logs/general-$(date +%Y-%m-%d).log" ]; then
        tail -n $LINES "logs/general-$(date +%Y-%m-%d).log"
    else
        echo "No general logs found for today"
    fi
else
    LOG_FILE="logs/$COMPONENT-$(date +%Y-%m-%d).log"
    if [ -f "$LOG_FILE" ]; then
        echo "📋 $COMPONENT Logs:"
        tail -n $LINES "$LOG_FILE"
    else
        echo "No logs found for component: $COMPONENT"
        echo "Available components: capture, semantic, api, general"
    fi
fi

echo -e "\n=================================================="
echo "💡 Tip: Use 'npm run dev' and check the Debug Logs button on the capture page for real-time logs"
