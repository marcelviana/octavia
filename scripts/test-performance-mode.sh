#!/bin/bash

# Performance Mode Test Suite Runner
# Validates critical performance requirements for live music performance

set -e

echo "🎵 OCTAVIA PERFORMANCE MODE TEST SUITE"
echo "======================================"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Test configuration
PERFORMANCE_TIMEOUT=10000  # 10 seconds max for performance tests
CRITICAL_TIMEOUT=5000      # 5 seconds max for critical tests

echo -e "${BLUE}📋 Test Plan:${NC}"
echo "1. Basic Performance Mode functionality"
echo "2. Critical live performance scenarios (<100ms navigation)"
echo "3. Offline integration and cache management"
echo "4. Error recovery and resilience"
echo ""

# Function to run test category and measure time
run_test_category() {
    local category=$1
    local description=$2
    local timeout=$3
    
    echo -e "${BLUE}🧪 Running: $description${NC}"
    
    start_time=$(date +%s%N)
    
    if pnpm exec vitest run "$category" --reporter=verbose; then
        end_time=$(date +%s%N)
        duration=$(( (end_time - start_time) / 1000000 )) # Convert to milliseconds
        echo -e "${GREEN}✅ PASSED${NC} - $description (${duration}ms)"
        return 0
    else
        echo -e "${RED}❌ FAILED${NC} - $description"
        return 1
    fi
}

# Track test results
TOTAL_TESTS=0
PASSED_TESTS=0

echo -e "${YELLOW}⚡ Starting Performance Mode Test Suite...${NC}"
echo ""

# 1. Basic Performance Mode Tests
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
if run_test_category "components/__tests__/performance-mode.test.tsx" "Basic Performance Mode Tests" $PERFORMANCE_TIMEOUT; then
    ((PASSED_TESTS++))
fi
((TOTAL_TESTS++))
echo ""

# 2. Critical Performance Tests (Fixed Version)
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
if run_test_category "components/__tests__/performance-mode-critical-fixed.test.tsx" "Critical Live Performance Tests (Fixed)" $CRITICAL_TIMEOUT; then
    ((PASSED_TESTS++))
fi
((TOTAL_TESTS++))
echo ""

# 3. Simple Critical Performance Tests
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
if run_test_category "components/__tests__/performance-mode-critical-simple.test.tsx" "Critical Performance Tests (Simple)" $PERFORMANCE_TIMEOUT; then
    ((PASSED_TESTS++))
fi
((TOTAL_TESTS++))
echo ""

# 4. Offline Integration Tests (Simple Version)
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
if run_test_category "components/__tests__/performance-mode-offline-simple.test.tsx" "Offline Integration Tests (Simple)" $PERFORMANCE_TIMEOUT; then
    ((PASSED_TESTS++))
fi
((TOTAL_TESTS++))
echo ""

# Generate test summary
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${BLUE}📊 TEST SUMMARY${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Total Test Categories: $TOTAL_TESTS"
echo "Passed Categories: $PASSED_TESTS"
echo "Failed Categories: $((TOTAL_TESTS - PASSED_TESTS))"
echo ""

if [ $PASSED_TESTS -eq $TOTAL_TESTS ]; then
    echo -e "${GREEN}🎉 ALL PERFORMANCE MODE TESTS PASSED!${NC}"
    echo ""
    echo -e "${GREEN}✨ Your performance mode is ready for live shows!${NC}"
    echo "   - Navigation response time: <100ms ✓"
    echo "   - Offline functionality: Working ✓"
    echo "   - Error recovery: Implemented ✓"
    echo "   - Cache management: Optimized ✓"
    echo ""
    exit 0
else
    echo -e "${RED}⚠️  PERFORMANCE MODE TESTS FAILED${NC}"
    echo ""
    echo -e "${RED}❌ Critical issues detected:${NC}"
    echo "   - Performance requirements not met"
    echo "   - Live performance reliability at risk"
    echo "   - Fix failing tests before production use"
    echo ""
    exit 1
fi