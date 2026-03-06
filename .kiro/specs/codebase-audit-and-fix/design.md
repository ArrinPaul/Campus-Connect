# Codebase Audit and Fix - Design Document

## Overview

This design outlines a systematic approach to audit and fix the Campus Connect codebase. The goal is to transform the codebase from a state with TypeScript errors ignored (`ignoreBuildErrors: true`) to a production-ready state where the application runs cleanly on localhost with all errors resolved, dead code removed, and partial implementations completed.

The audit and fix process follows a phased approach:
1. **Discovery Phase**: Identify all issues through automated tooling and manual inspection
2. **Categorization Phase**: Classify issues by severity and type
3. **Resolution Phase**: Fix issues systematically, starting with blockers
4. **Verification Phase**: Validate fixes and ensure no regressions

## Architecture

### Audit Strategy

The audit process uses multiple complementary approaches:

**Static Analysis**:
- TypeScript compiler (`tsc --noEmit`) to find type errors
- ESLint to find code quality issues, unused imports, and style violations
- Custom scripts to find unused exports, orphaned test files, and TODO comments
- Dependency analysis tools (depcheck) to find unused packages

**Runtime Analysis**:
- Start the development server and check for console errors
- Navigate through key application routes to identify runtime failures
- Test Convex connection and data fetching

**Manual Review**:
- Review existing audit reports (COMPREHENSIVE_AUDIT_REPORT.md, etc.)
- Identify incomplete implementations (stub pages, TODO comments)
- Check for missing error handling in critical paths

### Issue Classification

Issues are classified by:

**Severity**:
- **BLOCKER**: Prevents application from starting or causes immediate crashes
- **CRITICAL**: Breaks core functionality (auth, data fetching, navigation)
- **HIGH**: Breaks specific features but app remains usable
- **MEDIUM**: Degraded UX or incomplete features
- **LOW**: Code quality, optimization, or nice-to-have improvements

**Type**:
- **TypeScript Error**: Type mismatches, missing types, incorrect generics
- **Runtime Error**: Crashes, unhandled exceptions, null reference errors
- **Dead Code**: Unused imports, unreferenced functions, orphaned files
- **Incomplete Implementation**: TODO comments, stub pages, partial functions
- **Code Quality**: Linting violations, formatting inconsistencies
- **Test Failure**: Broken tests, incorrect mocks, missing test setup

### Resolution Strategy

**Phased Approach**:

1. **Phase 1 - Environment & Build**:
   - Fix environment setup (.env.example documentation)
   - Resolve TypeScript compilation errors
   - Remove `ignoreBuildErrors: true` flag
   - Ensure `npm run dev` starts successfully

2. **Phase 2 - Runtime Stability**:
   - Fix runtime errors preventing app startup
   - Fix Convex connection issues
   - Fix authentication flow errors
   - Fix critical navigation errors

3. **Phase 3 - Dead Code Removal**:
   - Remove unused imports (automated via ESLint fix)
   - Remove unused dependencies (via depcheck)
   - Remove orphaned test files
   - Remove unreferenced components/functions

4. **Phase 4 - Feature Completion**:
   - Address TODO comments
   - Complete stub pages
   - Add missing error handling
   - Implement missing API endpoints

5. **Phase 5 - Test Suite**:
   - Fix broken tests
   - Update test configuration
   - Ensure all tests pass
   - Remove tests for deleted code

6. **Phase 6 - Code Quality**:
   - Fix ESLint errors
   - Apply Prettier formatting
   - Ensure consistent import paths
   - Final verification

## Components and Interfaces

### Audit Scripts

**TypeScript Error Checker**:
```typescript
// scripts/check-typescript.ts
// Runs tsc --noEmit and reports errors
// Returns: { success: boolean, errors: TypeScriptError[] }
```

**Dead Code Detector**:
```typescript
// scripts/find-dead-code.ts
// Analyzes exports and imports to find unreferenced code
// Returns: { unusedExports: string[], unusedFiles: string[] }
```

**TODO Comment Finder**:
```typescript
// scripts/find-todos.ts
// Searches for TODO/FIXME comments
// Returns: { todos: TodoComment[] }
```

**Environment Variable Validator**:
```typescript
// scripts/validate-env.ts
// Compares env vars used in code vs documented in .env.example
// Returns: { undocumented: string[], unused: string[] }
```

**API Endpoint Validator**:
```typescript
// scripts/validate-api-endpoints.ts
// Checks that all frontend API calls have backend implementations
// Returns: { missingEndpoints: string[] }
```

### Issue Tracking

**Issue Report Format**:
```typescript
interface Issue {
  id: string;              // e.g., "TS-001", "RT-042"
  type: IssueType;
  severity: Severity;
  file: string;
  line?: number;
  description: string;
  suggestedFix?: string;
  status: "open" | "in-progress" | "fixed" | "wont-fix";
}
```

**Audit Report**:
- Generated as markdown file: `AUDIT_ISSUES.md`
- Grouped by phase and severity
- Includes fix recommendations
- Tracks resolution status

## Data Models

### Issue Categories

**TypeScript Errors**:
- Type mismatches (e.g., `string` assigned to `number`)
- Missing type definitions
- Incorrect generic parameters
- Null/undefined handling issues
- Import resolution failures

**Runtime Errors**:
- Unhandled promise rejections
- Null reference errors
- Missing environment variables
- Convex query failures
- Component rendering errors

**Dead Code**:
- Unused imports (detected by ESLint)
- Unreferenced exports (no imports found)
- Orphaned test files (test file exists but source doesn't)
- Unused dependencies (in package.json but never imported)
- Duplicate implementations (e.g., two PostCard components)

**Incomplete Implementations**:
- TODO/FIXME comments
- Functions that throw "Not implemented"
- Stub pages (empty or placeholder content)
- Missing error boundaries
- Incomplete form validation

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Environment Variable Documentation Completeness

*For any* environment variable referenced in the codebase (via `process.env.X`), that variable should be documented in `.env.example` with a description.

**Validates: Requirements 1.4**

### Property 2: Import Resolution

*For any* import statement in the codebase, the imported module should resolve successfully without errors.

**Validates: Requirements 4.4**

### Property 3: No Unused Imports

*For any* file in the codebase, running ESLint should report zero unused import warnings.

**Validates: Requirements 2.1**

### Property 4: No Unused Dependencies

*For any* dependency listed in `package.json`, that dependency should be imported in at least one file in the codebase.

**Validates: Requirements 2.4**

### Property 5: Test File Validity

*For any* test file in the codebase, all imports in that test file should resolve successfully (i.e., the code being tested exists).

**Validates: Requirements 2.5**

### Property 6: API Endpoint Existence

*For any* API call made in frontend code (e.g., `api.posts.create`), a corresponding backend endpoint should exist in the Convex functions.

**Validates: Requirements 3.5**

### Property 7: No Unreferenced Exports

*For any* exported function or component, that export should be imported in at least one other file (excluding entry points like pages).

**Validates: Requirements 2.2**

## Error Handling

### Error Handling Strategy

**Build-Time Errors**:
- TypeScript errors: Fix type issues, add proper types, handle null/undefined
- ESLint errors: Auto-fix where possible, manual fix for complex issues
- Import errors: Fix paths, add missing files, remove invalid imports

**Runtime Errors**:
- Add try-catch blocks around async operations
- Add error boundaries for React components
- Add null checks before accessing properties
- Add fallback UI for error states
- Log errors appropriately (console.error in dev, structured logging in prod)

**Convex Errors**:
- Handle authentication errors (redirect to sign-in)
- Handle query failures (show error message to user)
- Handle mutation failures (show toast notification)
- Add loading states for async operations

**Missing Implementations**:
- Complete stub functions with proper logic
- Add validation to incomplete forms
- Implement missing API endpoints
- Add error handling to partial implementations

### Error Boundaries

Ensure error boundaries exist at key levels:
- Root layout (catch all unhandled errors)
- Page level (catch page-specific errors)
- Feature level (catch feature-specific errors)

## Testing Strategy

### Dual Testing Approach

**Unit Tests**:
- Test specific examples and edge cases
- Test error conditions and validation logic
- Test utility functions and helpers
- Focus on business logic and data transformations

**Property-Based Tests**:
- Verify universal properties across all inputs
- Test invariants that should always hold
- Use fast-check library (already in dependencies)
- Minimum 100 iterations per property test

### Property Test Implementation

Each correctness property should be implemented as a property-based test:

**Property 1 - Environment Variable Documentation**:
```typescript
// scripts/__tests__/env-validation.property.test.ts
// Feature: codebase-audit-and-fix, Property 1: Environment Variable Documentation Completeness
// Validates: Requirements 1.4

import fc from 'fast-check';

test('all environment variables are documented', () => {
  const envVarsInCode = findEnvVarsInCode();
  const envVarsInExample = parseEnvExample();
  
  envVarsInCode.forEach(envVar => {
    expect(envVarsInExample).toContain(envVar);
  });
});
```

**Property 2 - Import Resolution**:
```typescript
// scripts/__tests__/import-resolution.property.test.ts
// Feature: codebase-audit-and-fix, Property 2: Import Resolution
// Validates: Requirements 4.4

test('all imports resolve successfully', () => {
  const allFiles = getAllSourceFiles();
  
  allFiles.forEach(file => {
    const imports = extractImports(file);
    imports.forEach(importPath => {
      expect(resolveImport(file, importPath)).toBeTruthy();
    });
  });
});
```

**Property 3 - No Unused Imports**:
```typescript
// scripts/__tests__/unused-imports.property.test.ts
// Feature: codebase-audit-and-fix, Property 3: No Unused Imports
// Validates: Requirements 2.1

test('no files have unused imports', () => {
  const allFiles = getAllSourceFiles();
  
  allFiles.forEach(file => {
    const eslintResult = runESLintOnFile(file);
    const unusedImportWarnings = eslintResult.messages.filter(
      m => m.ruleId === 'no-unused-vars' && m.message.includes('import')
    );
    expect(unusedImportWarnings).toHaveLength(0);
  });
});
```

**Property 4 - No Unused Dependencies**:
```typescript
// scripts/__tests__/unused-deps.property.test.ts
// Feature: codebase-audit-and-fix, Property 4: No Unused Dependencies
// Validates: Requirements 2.4

test('all dependencies are used', () => {
  const packageJson = require('../../package.json');
  const allDeps = {
    ...packageJson.dependencies,
    ...packageJson.devDependencies
  };
  
  Object.keys(allDeps).forEach(dep => {
    const isUsed = isDependencyImported(dep);
    expect(isUsed).toBe(true);
  });
});
```

**Property 5 - Test File Validity**:
```typescript
// scripts/__tests__/test-validity.property.test.ts
// Feature: codebase-audit-and-fix, Property 5: Test File Validity
// Validates: Requirements 2.5

test('all test files import existing code', () => {
  const testFiles = getAllTestFiles();
  
  testFiles.forEach(testFile => {
    const imports = extractImports(testFile);
    imports.forEach(importPath => {
      if (!importPath.includes('node_modules')) {
        expect(resolveImport(testFile, importPath)).toBeTruthy();
      }
    });
  });
});
```

**Property 6 - API Endpoint Existence**:
```typescript
// scripts/__tests__/api-endpoints.property.test.ts
// Feature: codebase-audit-and-fix, Property 6: API Endpoint Existence
// Validates: Requirements 3.5

test('all frontend API calls have backend implementations', () => {
  const apiCalls = findAllApiCalls(); // e.g., api.posts.create
  const convexFunctions = getAllConvexFunctions();
  
  apiCalls.forEach(call => {
    const [module, functionName] = call.split('.');
    expect(convexFunctions[module]).toContain(functionName);
  });
});
```

**Property 7 - No Unreferenced Exports**:
```typescript
// scripts/__tests__/unreferenced-exports.property.test.ts
// Feature: codebase-audit-and-fix, Property 7: No Unreferenced Exports
// Validates: Requirements 2.2

test('all exports are imported somewhere', () => {
  const allExports = findAllExports();
  const allImports = findAllImports();
  const entryPoints = getEntryPoints(); // pages, app routes
  
  allExports.forEach(exp => {
    const isEntryPoint = entryPoints.includes(exp.file);
    const isImported = allImports.some(imp => 
      imp.source === exp.file && imp.name === exp.name
    );
    
    expect(isEntryPoint || isImported).toBe(true);
  });
});
```

### Example Tests

In addition to property tests, create example tests for specific scenarios:

**TypeScript Compilation**:
```typescript
// scripts/__tests__/typescript.test.ts
test('TypeScript compiles without errors', () => {
  const result = execSync('npx tsc --noEmit', { encoding: 'utf-8' });
  expect(result).toBe('');
});
```

**Application Startup**:
```typescript
// scripts/__tests__/startup.test.ts
test('application starts successfully', async () => {
  const devServer = spawn('npm', ['run', 'dev']);
  
  await waitForServer('http://localhost:3000', 30000);
  
  const response = await fetch('http://localhost:3000');
  expect(response.status).toBe(200);
  
  devServer.kill();
});
```

**ESLint Passes**:
```typescript
// scripts/__tests__/eslint.test.ts
test('ESLint passes without errors', () => {
  const result = execSync('npm run lint', { encoding: 'utf-8' });
  expect(result).not.toContain('error');
});
```

**All Tests Pass**:
```typescript
// scripts/__tests__/test-suite.test.ts
test('all existing tests pass', () => {
  const result = execSync('npm test -- --passWithNoTests', { encoding: 'utf-8' });
  expect(result).toContain('Tests passed');
});
```

### Test Configuration

- Use Jest for test runner (already configured)
- Use fast-check for property-based testing
- Configure tests to run in CI/CD pipeline
- Each property test runs minimum 100 iterations
- Tag each test with feature name and property number

## Implementation Notes

### Known Issues from Audit Reports

Based on COMPREHENSIVE_AUDIT_REPORT.md, the following issues have been identified:

**Already Fixed** (24 issues):
- PostCard non-interactive implementation
- Hashtag system not working
- Marketplace price display bug
- Profile ownership detection
- Story image upload
- Event creation button
- Message conversation creation
- Various auth guards and modal wiring

**Remaining Issues** (from roadmap):
- Leaderboard period filter
- Settings stub pages (privacy, billing)
- Explore stub pages (find partners, find experts)
- Admin dashboard TODOs
- Resource upload flow
- Paper upload flow
- Message attachments
- Job search/filter UI

### TypeScript Configuration

Current tsconfig.json has:
- `strict: true` - good, keep this
- `skipLibCheck: true` - acceptable for performance
- Path aliases configured: `@/*` and `@/convex/*`

### Next.js Configuration

Current next.config.js has:
- `ignoreBuildErrors: true` - **MUST REMOVE** after fixing TypeScript errors
- Comprehensive security headers - good
- Image optimization configured - good

### Convex Integration

- Convex types are generated in `convex/_generated/`
- Run `npx convex dev` to regenerate types
- Ensure types are up-to-date before fixing TypeScript errors

### Dependency Management

Current dependencies look reasonable:
- Next.js 14 with App Router
- Convex for backend
- Clerk for auth
- Radix UI for components
- TipTap for rich text editing
- fast-check for property testing (good!)

Check for unused dependencies with depcheck.

### File Organization

The codebase has:
- `src/app/` - Next.js App Router pages
- `src/components/` - React components organized by feature
- `src/hooks/` - Custom React hooks
- `src/lib/` - Utility functions and services
- `convex/` - Backend functions and schema

Some duplication noted:
- Two PostCard implementations (already fixed per audit report)
- Check for other duplicate components

### Testing Infrastructure

- Jest configured with jsdom environment
- React Testing Library for component tests
- fast-check for property-based tests
- Test files co-located with source files

Ensure test configuration is correct and all tests can run.

## Success Criteria

The audit and fix is complete when:

1. ✅ `npm run dev` starts without errors
2. ✅ Application loads on localhost:3000 without console errors
3. ✅ `npx tsc --noEmit` passes with zero errors
4. ✅ `npm run lint` passes with zero errors
5. ✅ `npm test` passes with all tests green
6. ✅ `ignoreBuildErrors: true` removed from next.config.js
7. ✅ All environment variables documented in .env.example
8. ✅ No unused imports (ESLint clean)
9. ✅ No unused dependencies (depcheck clean)
10. ✅ No orphaned test files
11. ✅ All TODO comments addressed or tracked
12. ✅ Core features functional (feed, messages, profiles, etc.)
13. ✅ All property-based tests passing

## Out of Scope

The following are explicitly out of scope for this audit:

- Adding new features
- Major architectural refactoring
- Performance optimization (unless blocking)
- UI/UX improvements (unless broken)
- Accessibility improvements (unless blocking)
- SEO optimization
- Analytics implementation
- Deployment configuration
- Database migrations
- Third-party integrations

Focus is strictly on fixing existing issues and removing dead code.
