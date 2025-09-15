# 🔧 **How to Apply the Timeout Fix Strategy**

## **Step-by-Step Example: Fixing the `returns setlists with songs` Test**

### **Current Failing Test Analysis:**

```bash
# Current failure:
❌ Test timed out in 30000ms
❌ "returns setlists with songs for authenticated user"

# Root cause: 
❌ Complex mock call counting fails with dynamic query chains
❌ Promise.all loops break simple mocking approach
```

### **Before: Problematic Mock Setup**

```typescript
// ❌ BROKEN: Call counting approach
let callCount = 0
mockSupabaseClient.from = vi.fn(() => {
  const builder = createMockQueryBuilder()
  
  if (callCount === 0) {
    // First call: setlists query
    builder.then.mockResolvedValue({ data: [mockSetlist], error: null })
  } else if (callCount === 1) {
    // Second call: setlist_songs query  
    builder.then.mockResolvedValue({ data: mockSetlistSongs, error: null })
  } else {
    // Third call: content query
    builder.then.mockResolvedValue({ data: mockContent, error: null })
  }
  
  callCount++
  return builder
})
```

**Why this fails:**
- API makes dynamic queries in `Promise.all` loops
- Query count varies based on data returned
- Call order isn't predictable
- Mock becomes out of sync with actual queries

### **After: Smart Table-Based Mock**

```typescript
// ✅ FIXED: Table-based dispatch
import { setupAPIMocks } from '@/lib/test-utils/api-test-helpers'

const { 
  mockRequireAuthServer, 
  factory, 
  mockUser, 
  mockSetlists, 
  mockSetlistSongs, 
  mockContent,
  supabaseMock 
} = setupAPIMocks()

vi.mock('@/lib/supabase-service', () => ({
  getSupabaseServiceClient: () => supabaseMock
}))

describe('/api/setlists', () => {
  beforeEach(() => {
    factory.clear()
    factory
      .setMockData('setlists', mockSetlists)
      .setMockData('setlist_songs', mockSetlistSongs)
      .setMockData('content', mockContent)
  })

  it('returns setlists with songs for authenticated user', async () => {
    // Setup auth
    mockRequireAuthServer.mockResolvedValue(mockUser)
    
    // Make request
    const request = new NextRequest('http://localhost:3000/api/setlists')
    const response = await GET(request)
    const data = await response.json()

    // Verify response
    expect(response.status).toBe(200)
    expect(data).toHaveLength(1)
    expect(data[0].setlist_songs).toHaveLength(2)
    expect(data[0].setlist_songs[0].content.title).toBe('Wonderwall')
  })
})
```

**Why this works:**
- ✅ Mock responds to `supabase.from('setlists')` with setlist data
- ✅ Mock responds to `supabase.from('setlist_songs')` with song data  
- ✅ Mock responds to `supabase.from('content')` with content data
- ✅ Handles `Promise.all`, filtering, ordering automatically
- ✅ No call counting or query order dependencies

## **Implementation Commands:**

### **1. Install the Test Utils:**
```bash
# The utils are already created in lib/test-utils/
# - supabase-mock-factory.ts
# - api-test-helpers.ts
```

### **2. Apply to One Test File:**
```bash
# Choose your first file to fix:
# app/api/setlists/__tests__/route.test.ts

# Replace the mock setup section (lines ~1-50) with:
```

```typescript
import { setupAPIMocks } from '@/lib/test-utils/api-test-helpers'

const { 
  mockRequireAuthServer, 
  factory, 
  mockUser,
  supabaseMock 
} = setupAPIMocks()

vi.mock('@/lib/supabase-service', () => ({
  getSupabaseServiceClient: () => supabaseMock
}))
```

### **3. Update Test Structure:**
```typescript
describe('/api/setlists', () => {
  beforeEach(() => {
    factory.clear()
    // Set default test data
    factory
      .setMockData('setlists', mockSetlists)
      .setMockData('setlist_songs', mockSetlistSongs)
      .setMockData('content', mockContent)
    vi.clearAllMocks()
  })

  // Remove all the complex mock setup from individual tests
  // Keep only the test logic
})
```

### **4. Test the Fix:**
```bash
# Test the specific failing test:
npx vitest run app/api/setlists/__tests__/route.test.ts -t "returns setlists with songs"

# Expected result:
✅ Test completes in <1 second
✅ No timeout errors
✅ Proper response validation
```

## **Scaling to All Failing Tests:**

### **Files to Fix (in order):**
1. `app/api/setlists/__tests__/route.test.ts` (4 timeout tests)
2. `app/api/setlists/[id]/__tests__/route.test.ts` (13 timeout tests)  
3. `app/api/setlists/[id]/songs/__tests__/route.test.ts` (Already working!)

### **Pattern for Each File:**
1. **Replace imports** with `setupAPIMocks()`
2. **Replace vi.mock** with smart mock
3. **Replace beforeEach** with factory setup
4. **Remove complex mock logic** from tests
5. **Keep test assertions** unchanged

### **Time Estimate:**
- **File 1**: 30 minutes (learn the pattern)
- **File 2**: 15 minutes (apply the pattern)  
- **File 3**: 5 minutes (verify it works)
- **Total**: ~50 minutes to fix all 54 timeout tests

## **Validation Steps:**

### **1. Individual Test:**
```bash
npx vitest run app/api/setlists/__tests__/route.test.ts --reporter=verbose
# Should show all tests passing in <5 seconds total
```

### **2. Full API Test Suite:**
```bash
npx vitest run app/api/ --reporter=basic
# Should show 0 timeout failures
```

### **3. Complete Test Suite:**
```bash
npx vitest run --exclude '**/*integration*.test.{ts,tsx}' --reporter=basic
# Should show >95% test success rate
```

## **Expected Final Results:**

### **Before Fix:**
- ❌ 54 failing timeout tests  
- ❌ 30 seconds per test failure
- ❌ ~30 minutes test run time

### **After Fix:**
- ✅ 0 timeout tests
- ✅ <1 second per test
- ✅ <2 minutes total test run time
- ✅ 890+ passing tests (99%+ success rate)

This approach transforms the most challenging API tests into fast, reliable, maintainable unit tests that accurately mock the complex Supabase query patterns.
