# 🎯 Smart Strategy to Fix Complex API Timeout Tests

## 🔍 **Root Cause Analysis**

The API timeout tests fail because of **complex, dynamic Supabase query chains**:

### Current Problems:
- ❌ **Call counting approach fails** with dynamic queries
- ❌ **Promise.all** loops break simple mocking
- ❌ **Query dependencies** aren't handled properly
- ❌ **Table-specific responses** need different logic

### Example Failing Pattern:
```typescript
// API makes these queries dynamically:
// 1. Get setlists for user 
// 2. For EACH setlist → Get setlist_songs
// 3. For EACH setlist → Get content for songs
// Current mock tries to count calls but fails with dynamic loops
```

## 🧠 **Smart Solution: Table-Based Mock Dispatch**

### Key Innovation:
Instead of counting calls, **dispatch based on table name and query parameters**.

### Core Components:

#### 1. **SupabaseMockFactory** - Smart Query Dispatcher
```typescript
// Responds to queries based on table + filters, not call order
factory.setMockData('setlists', mockSetlists)
factory.setMockData('setlist_songs', mockSetlistSongs)  
factory.setMockData('content', mockContent)

// Automatically handles: .eq(), .in(), .order(), Promise.all, etc.
```

#### 2. **Table-Aware Query Building**
```typescript
// Mock detects: supabase.from('setlists').select().eq('user_id', '123')
// Returns: Filtered setlists for that user
// Mock detects: supabase.from('content').in('id', ['content-1', 'content-2'])  
// Returns: Matching content items
```

#### 3. **Error Scenario Management**
```typescript
const errorScenarios = createErrorScenarios(factory)
errorScenarios.databaseError()     // Sets database error
errorScenarios.setlistNotFound()   // Sets PGRST116 error
errorScenarios.contentNotFound()   // Sets empty content
```

## 🔧 **Implementation Steps**

### Step 1: Replace Existing Test Files

**Before (Broken):**
```typescript
// ❌ Call counting approach
let callCount = 0
mockSupabaseClient.from = vi.fn(() => {
  if (callCount === 0) { /* setlists */ }
  else if (callCount === 1) { /* songs */ }
  // Breaks with dynamic queries!
})
```

**After (Smart):**
```typescript
// ✅ Table-based dispatch
const { factory, mockUser, supabaseMock } = setupAPIMocks()
vi.mock('@/lib/supabase-service', () => ({
  getSupabaseServiceClient: () => supabaseMock
}))
```

### Step 2: Configure Test Data Per Scenario

```typescript
describe('API Tests', () => {
  beforeEach(() => {
    factory.clear()
    factory
      .setMockData('setlists', mockSetlists)
      .setMockData('setlist_songs', mockSetlistSongs)  
      .setMockData('content', mockContent)
  })

  it('handles complex query chains', async () => {
    // Mock automatically handles all queries!
    const response = await GET(request)
    expect(response.status).toBe(200)
  })
})
```

### Step 3: Apply to All Failing Tests

**Files to Update:**
- `app/api/setlists/__tests__/route.test.ts`
- `app/api/setlists/[id]/__tests__/route.test.ts`  
- `app/api/setlists/[id]/songs/__tests__/route.test.ts`

**Pattern for Each File:**
1. Replace mock setup with `setupAPIMocks()`
2. Use `factory.setMockData()` for test scenarios
3. Use `createErrorScenarios()` for error tests
4. Remove all call counting logic

## 🚀 **Quick Migration Template**

### For Each Failing Test File:

```typescript
// 1. Replace imports
import { setupAPIMocks, createErrorScenarios } from '@/lib/test-utils/api-test-helpers'

// 2. Replace mock setup
const { mockRequireAuthServer, factory, mockUser, supabaseMock } = setupAPIMocks()

// 3. Replace vi.mock calls
vi.mock('@/lib/supabase-service', () => ({
  getSupabaseServiceClient: () => supabaseMock
}))

// 4. Update test structure
describe('API Tests', () => {
  beforeEach(() => {
    factory.clear().setMockData('setlists', mockSetlists)
  })

  it('test case', async () => {
    mockRequireAuthServer.mockResolvedValue(mockUser)
    // Test logic - no more mock setup needed!
  })
})
```

## 📊 **Expected Results**

### Before:
- ❌ 54 timeout tests failing
- ❌ 30 second waits per test
- ❌ Complex mock debugging

### After:  
- ✅ All API tests pass quickly
- ✅ Sub-second test execution
- ✅ Easy error scenario testing
- ✅ Maintainable mock logic

## 🎯 **Rollout Plan**

### Phase 1: Core Infrastructure ✅
- [x] Create `SupabaseMockFactory`
- [x] Create `setupAPIMocks` helper
- [x] Create error scenario utilities

### Phase 2: Fix Priority Tests
1. **Fix setlists main route** (`/api/setlists`)
2. **Fix setlist ID route** (`/api/setlists/[id]`)  
3. **Fix setlist songs route** (`/api/setlists/[id]/songs`)

### Phase 3: Validate & Optimize
1. **Run full test suite**
2. **Verify 0 timeout failures**
3. **Optimize test performance**

## 🔬 **Testing the Strategy**

To validate this approach works:

```bash
# Test the new mock factory
npm run test lib/test-utils/supabase-mock-factory.test.ts

# Test one converted API route  
npm run test app/api/setlists/__tests__/route-fixed.test.ts

# Apply to real failing test
# (Replace route.test.ts with new pattern)
```

## 💡 **Key Benefits**

1. **🎯 Accurate**: Mocks actual database behavior
2. **🚀 Fast**: No more 30-second timeouts  
3. **🔧 Maintainable**: Table-based, not call-based
4. **📈 Scalable**: Works for any API complexity
5. **🧪 Testable**: Easy error scenarios
6. **🔍 Debuggable**: Query logging included

This strategy transforms the most challenging timeout tests into fast, reliable unit tests that accurately reflect the real API behavior.
