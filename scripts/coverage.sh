#!/bin/bash

# Coverage script for Octavia
# This script helps with local coverage testing and Codecov integration

set -e

echo "🎵 Octavia Coverage Script"
echo "=========================="

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found. Please run this script from the project root."
    exit 1
fi

# Function to run tests with coverage
run_coverage() {
    echo "🧪 Running tests with coverage..."
    pnpm test:ci
    
    echo "📊 Coverage report generated in ./coverage/"
    echo "📁 Coverage files:"
    ls -la coverage/
    
    if [ -f "coverage/coverage-final.json" ]; then
        echo "✅ coverage-final.json generated successfully"
    else
        echo "❌ coverage-final.json not found"
        exit 1
    fi
}

# Function to open coverage report
open_report() {
    if [ -f "coverage/index.html" ]; then
        echo "🌐 Opening coverage report..."
        if command -v open >/dev/null 2>&1; then
            open coverage/index.html
        elif command -v xdg-open >/dev/null 2>&1; then
            xdg-open coverage/index.html
        else
            echo "📄 Coverage report available at: coverage/index.html"
        fi
    else
        echo "❌ Coverage report not found. Run tests first."
        exit 1
    fi
}

# Function to check coverage thresholds
check_thresholds() {
    echo "🎯 Checking coverage thresholds..."
    
    # Run coverage and capture output
    COVERAGE_OUTPUT=$(pnpm test:coverage 2>&1)
    
    # Check if coverage meets thresholds
    if echo "$COVERAGE_OUTPUT" | grep -q "All files"; then
        echo "✅ Coverage thresholds met"
        echo "$COVERAGE_OUTPUT" | grep -A 10 "All files"
    else
        echo "❌ Coverage thresholds not met"
        echo "$COVERAGE_OUTPUT"
        exit 1
    fi
}

# Main script logic
case "${1:-help}" in
    "run")
        run_coverage
        ;;
    "open")
        open_report
        ;;
    "check")
        check_thresholds
        ;;
    "full")
        run_coverage
        open_report
        ;;
    "help"|*)
        echo "Usage: $0 [command]"
        echo ""
        echo "Commands:"
        echo "  run    - Run tests with coverage"
        echo "  open   - Open coverage report in browser"
        echo "  check  - Check if coverage meets thresholds"
        echo "  full   - Run coverage and open report"
        echo "  help   - Show this help message"
        echo ""
        echo "Examples:"
        echo "  $0 run     # Run tests with coverage"
        echo "  $0 open    # Open coverage report"
        echo "  $0 full    # Run coverage and open report"
        ;;
esac 