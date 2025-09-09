# 🎵 Performance Mode Testing Strategy

## Overview

This document outlines the comprehensive testing approach for Octavia's Performance Mode - the critical component used during live music performances where reliability is paramount.

## 🎯 Testing Goals

### Primary Objectives
- **<100ms navigation response time** during live performances
- **Zero network dependency** for cached content
- **Graceful error recovery** from all failure scenarios
- **Memory leak prevention** during long performances
- **Offline-first reliability** with cache fallbacks

### Test Coverage Targets
- **Performance Mode Core**: 95% coverage (critical path)
- **Offline Cache Integration**: 90% coverage
- **Error Recovery Scenarios**: 85% coverage
- **Performance Benchmarks**: 100% of timing requirements

## 📁 Test File Structure

### 1. Basic Functionality Tests
**File**: `performance-mode.test.tsx` (Existing)
- ✅ Basic rendering and UI interactions
- ✅ Song navigation controls
- ✅ BPM and zoom controls
- ✅ Keyboard shortcuts
- ✅ Content type handling (PDF, images, lyrics)

### 2. Critical Performance Tests
**File**: `performance-mode-critical.test.tsx` (New)
- 🎯 **<100ms navigation timing** requirements
- 🎯 **Rapid interaction handling** (nervous musician scenarios)
- 🎯 **Large setlist performance** (50+ songs)
- 🎯 **Memory management** and cleanup
- 🎯 **Error recovery** during live performance

### 3. Offline Integration Tests  
**File**: `performance-mode-offline.integration.test.tsx` (New)
- 🌐 **Online → Offline transitions**
- 💾 **Cache management** and storage limits
- 🔄 **Network failure recovery**
- 🔐 **Authentication persistence** when offline
- 🗂️ **IndexedDB reliability** testing

## 🧪 Test Categories

### Critical Live Performance Scenarios

#### Navigation Performance
```typescript
// REQUIREMENT: <100ms response time
it('should navigate between songs in under 100ms', async () => {
  const navigationTime = measureNavigationTime();
  expect(navigationTime).toBeLessThan(100);
});
```

#### Offline Reliability
```typescript  
// REQUIREMENT: Zero network dependency
it('should work completely offline with cached content', async () => {
  simulateOfflineMode();
  await validateFullSetlistNavigation();
  expectZeroNetworkRequests();
});
```

#### Error Recovery
```typescript
// REQUIREMENT: Graceful degradation
it('should recover from corrupted cache data', async () => {
  injectCorruptedCacheData();
  await validateGracefulFallback();
  expectContinuedFunctionality();
});
```

### Performance Benchmarks

| Scenario | Requirement | Test Method |
|----------|-------------|-------------|
| Song Navigation | <100ms | Performance timing with `performance.now()` |
| Content Loading | <50ms (cached) | Cache hit response measurement |
| Setlist Rendering | <500ms (50 songs) | Large dataset rendering test |
| Memory Usage | No leaks | Mount/unmount cycle validation |
| Cache Access | <25ms | IndexedDB query performance |

### Error Scenarios Tested

1. **Network Failures**
   - Complete offline mode
   - Intermittent connectivity
   - DNS resolution failures
   - Timeout scenarios

2. **Cache Failures**  
   - IndexedDB corruption
   - Storage quota exceeded
   - Invalid cached data
   - Missing cache entries

3. **Authentication Issues**
   - Token expiration
   - Network auth failures
   - Session persistence
   - Offline auth state

4. **Resource Issues**
   - Memory exhaustion
   - Large file handling
   - Concurrent operations
   - Browser resource limits

## 🚀 Running the Tests

### Quick Test Run
```bash
# Run all performance mode tests
pnpm test performance-mode

# Run with coverage
pnpm test:coverage performance-mode

# Run critical tests only
pnpm test performance-mode-critical
```

### Comprehensive Test Suite
```bash
# Use the dedicated test script
./scripts/test-performance-mode.sh
```

### Individual Test Categories
```bash
# Basic functionality
pnpm exec vitest run components/__tests__/performance-mode.test.tsx

# Critical performance requirements
pnpm exec vitest run components/__tests__/performance-mode-critical.test.tsx

# Offline integration
pnpm exec vitest run components/__tests__/performance-mode-offline.integration.test.tsx
```

## 📊 Performance Validation

### Timing Requirements Validation
```typescript
describe('Performance Timing Validation', () => {
  it('meets all critical timing requirements', () => {
    const results = runPerformanceTests();
    
    expect(results.navigation).toBeLessThan(100); // ms
    expect(results.cacheAccess).toBeLessThan(25); // ms
    expect(results.rendering).toBeLessThan(500); // ms
    expect(results.memoryLeaks).toBe(0);
  });
});
```

### Load Testing Scenarios
- **50-song setlists** (marathon performances)
- **4-hour continuous usage** (long gigs)  
- **Rapid navigation patterns** (nervous musicians)
- **Memory pressure conditions** (low-end devices)

## 🔧 Mock Strategy

### External Dependencies
- **Firebase Auth**: Controlled authentication states
- **IndexedDB**: Predictable cache responses  
- **Network**: Offline/online simulation
- **Performance APIs**: Timing measurement
- **Service Worker**: Cache behavior simulation

### Test Data
- **Realistic setlists** with mixed content types
- **Large file scenarios** (high-res PDFs)
- **Network failure patterns** based on real conditions
- **Cache corruption scenarios** from production issues

## 🎯 Success Criteria

### Performance Mode is Ready for Production When:

✅ **All critical tests pass** with timing requirements  
✅ **95%+ test coverage** on performance mode core  
✅ **Zero memory leaks** in 4-hour test runs  
✅ **Sub-100ms navigation** in all test scenarios  
✅ **Complete offline functionality** with cache fallbacks  
✅ **Graceful error recovery** from all failure modes  

### Red Flags (Block Production)
❌ Any critical test failure  
❌ Navigation >100ms in any scenario  
❌ Memory leaks detected  
❌ Network dependency for cached content  
❌ Crash scenarios without recovery  

## 🚨 Critical Path Testing

### Pre-Performance Checklist
1. Run full performance test suite
2. Validate cache preloading
3. Test offline scenarios
4. Confirm error recovery
5. Memory leak validation

### Live Performance Simulation
```bash
# Simulate 2-hour gig with 25 songs
npm run test:performance-simulation

# Test with network interruptions
npm run test:offline-transitions

# Validate memory stability
npm run test:memory-endurance
```

## 📈 Continuous Integration

### CI Pipeline Requirements
- **All performance tests must pass** before merge
- **Timing benchmarks** tracked over time
- **Memory usage** regression detection
- **Coverage reports** for performance mode
- **Load testing** on representative hardware

### Performance Regression Detection
- Track navigation timing trends
- Monitor cache performance
- Alert on memory usage increases
- Validate error recovery scenarios

---

## 🎵 Why This Matters

Performance Mode is used during **live music performances** where:
- **Failure = Public embarrassment** and lost gigs
- **<100ms navigation** is required for smooth shows
- **Offline reliability** is critical (venues have poor WiFi)
- **Error recovery** must be seamless and invisible
- **Memory leaks** cause crashes during long performances

This testing strategy ensures Octavia delivers **professional-grade reliability** for live music performance scenarios.