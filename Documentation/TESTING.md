# Testing Setup Documentation

## Overview

This document describes the unit testing infrastructure set up for the OncoQuery project, including both backend (Python/FastAPI) and frontend (React/TypeScript) tests, their integration with GitLab CI/CD, and the challenges encountered during setup.

---

## Backend Testing

### Framework & Setup
- **Framework**: pytest
- **Additional Libraries**: 
  - `pytest-asyncio` - For testing async FastAPI endpoints
  - `pytest-cov` - For code coverage reports
  - `httpx` - Async HTTP client for testing
- **Location**: `backend/tests/`
- **Configuration**: pytest settings in `backend/pyproject.toml`

### Test Files Created

#### 1. `backend/tests/conftest.py`
- Provides shared test fixtures for all backend tests
- Includes `test_client` fixture for making HTTP requests to the FastAPI app
- Handles test environment setup and teardown

#### 2. `backend/tests/test_api.py` (~80 lines)
**Purpose**: Basic API endpoint validation
- Tests `/` root endpoint returns expected response
- Validates content type and status codes
- Verifies API is accessible and responsive

#### 3. `backend/tests/test_chat.py` (~250 lines)
**Purpose**: Comprehensive testing of the main chat streaming endpoint
**Key Test Cases**:
- `/chat` endpoint accepts POST requests with message data
- Streaming responses use Server-Sent Events (SSE) format correctly
- Event types include content deltas and tool events
- Headers are properly set (Content-Type: text/event-stream, Cache-Control)
- Tool events are properly formatted and drainable
- Response streaming completes without hanging

**Why It Matters**: The chat endpoint is the core of the application, handling AI-powered conversations with streaming responses. These tests ensure the streaming protocol works correctly.

#### 4. `backend/tests/test_mcp_servers.py` (~330 lines)
**Purpose**: Testing MCP (Model Context Protocol) server configuration and discovery
**Key Test Cases**:
- `_node_server()` helper function creates proper Node.js command structures
- `build_mcp_servers()` discovers and configures available MCP servers
- Environment variables (like NCBI API keys) are properly read and applied
- Fallback behaviors work when environment vars are missing
- MCP servers are correctly initialized with required parameters

**Why It Matters**: MCP servers provide data sources for the AI (e.g., NCBI, PubMed integration). Misconfiguration here breaks data access.

### Running Backend Tests Locally

```bash
cd backend

# Run all tests with verbose output
python -m pytest tests/ -v

# Run with coverage report (HTML output to htmlcov/)
python -m pytest tests/ --cov=. --cov-report=html

# Run specific test file
python -m pytest tests/test_chat.py -v

# Run specific test function
python -m pytest tests/test_chat.py::test_chat_endpoint_returns_200 -v
```

---

## Frontend Testing

### Framework & Setup
- **Framework**: vitest (Vite-native test runner)
- **DOM Testing**: `@testing-library/react`
- **Additional Libraries**:
  - `jsdom` - JavaScript DOM implementation for testing
  - `@vitest/coverage-v8` - Code coverage reports
  - `@testing-library/jest-dom` - Custom matchers (toBeInTheDocument, etc.)
- **Location**: `frontend/src/test/`
- **Configuration**: `frontend/vitest.config.ts`

### Test Files Created

#### 1. `frontend/src/test/setup.ts`
- Test environment initialization
- Registers jest-DOM matchers globally
- Mocks `window.matchMedia()` for responsive design testing
- Ensures DOM API is available in jsdom environment

#### 2. `frontend/src/test/components.test.tsx` (~100 lines)
**Purpose**: Header component validation
**Key Test Cases**:
- Header component renders without crashing
- Displays the correct title text
- Navigation elements are present and properly rendered
- Responsive styling works correctly
- Mobile menu icon appears on small screens

#### 3. `frontend/src/test/sidebar.test.tsx` (~100 lines)
**Purpose**: Sidebar navigation component validation
**Key Test Cases**:
- Sidebar renders with expected navigation items
- Menu items are clickable and properly linked
- Sidebar can be toggled (collapse/expand)
- Mobile responsiveness works
- Proper styling applied to active menu items

### Running Frontend Tests Locally

```bash
cd frontend

# Run all tests with watch mode
npm run test

# Run tests once (CI mode)
npm run test -- --run

# Run with coverage report
npm run test:cov

# Run specific test file
npm run test -- components.test.tsx
```

---

## CI/CD Integration (GitLab)

### Pipeline Configuration
- **File**: `.gitlab-ci.yml`
- **Runner Type**: Shell executor (can be local or cloud-based)
- **Platform**: Windows (self-hosted runner)

### CI Jobs

#### Backend Unit Tests Job
```yaml
backend_unit_tests:
  stage: test
  script:
    - cd backend
    - pip install --upgrade pip
    - pip install -e .
    - python -m pytest tests/ -v --cov=. --cov-report=html:coverage_report --cov-report=xml:coverage.xml
  artifacts:
    reports:
      coverage_report:
        coverage_format: cobertura
        path: backend/coverage.xml
    paths:
      - backend/coverage_report/
    expire_in: 1 week
  allow_failure: false
```

#### Frontend Unit Tests Job
```yaml
frontend_unit_tests:
  stage: test
  script:
    - cd frontend
    - npm install
    - npm run test -- --run --coverage
  artifacts:
    paths:
      - frontend/coverage/
    expire_in: 1 week
  allow_failure: false
```

### Triggering Tests
- Tests run automatically on push to any branch
- Tests run on merge requests
- Coverage reports are generated and accessible in GitLab UI

---

## Difficulties Encountered & Solutions

### 1. **Egg-info Files Accidentally Committed**
**Problem**: After running `pip install -e .` during initial setup, Python auto-generated `backend/oncoquery_api.egg-info/` files were committed to git, bloating the repository.

**Why It Happened**: The `egg-info` directory wasn't in `.gitignore` initially.

**Solution**:
- Added patterns to `.gitignore`: `*.egg-info/`, `.pytest_cache/`, `.coverage`, `htmlcov/`
- Used `git filter-repo` to rewrite history and remove the committed files
- Force-pushed cleaned history to remote
- **Key Learning**: Always add auto-generated directories to `.gitignore` before committing

### 2. **Windows pip Upgrade Failure in CI**
**Problem**: GitLab CI job failed with error when running `pip install --upgrade pip` on Windows shell executor:
```
ERROR: To modify pip, please run the following command:
python.exe -m pip install --upgrade pip
```

**Why It Happened**: Windows pip doesn't allow direct self-upgrade via `pip` command; requires Python module invocation.

**Solution**:
- Changed `.gitlab-ci.yml` from `pip install --upgrade pip` to `python -m pip install --upgrade pip`
- This works consistently on Windows shell executors
- **Key Learning**: Shell executor commands vary by OS; Windows requires python -m prefix for pip operations

### 3. **Missing Vitest Coverage Dependency**
**Problem**: Frontend tests ran but coverage reports failed with missing dependency error.

**Solution**:
- Added `@vitest/coverage-v8` to `frontend/package.json` dev dependencies
- Re-ran tests with `npm run test:cov`
- **Key Learning**: Vitest coverage is modular; must explicitly install coverage provider package

### 4. **Git Branch Naming Conflict**
**Problem**: User requested branch `paumuap/units` but it conflicted with existing `paumuap` branch.

**Solution**:
- Created `units/backend` instead, then `units/frontend`
- Both branches follow naming convention and are clear about purpose
- Merged frontend tests to main successfully

### 5. **Frontend API URL Hardcoding**
**Problem**: Authentication components (SignIn, Register) had hardcoded `http://localhost:8000` API URLs, making them inflexible.

**Solution**:
- Refactored `App.tsx` to define `API_URL` constant
- Passed `apiUrl` as prop to SignIn and Register components
- Updated all fetch calls to use `${apiUrl}` instead of hardcoded localhost
- Makes deployment easier; only API_URL needs to change per environment
- **Key Learning**: Configuration should flow down as props, not hardcoded

### 6. **GitLab Runner Setup on Windows**
**Problem**: Runner kept showing "Pending" status and wouldn't execute jobs.

**Why It Happened**: 
- Runner wasn't installed initially
- `gitlab-runner register` requires the binary to be in PATH or fully qualified
- Runner process wasn't kept running

**Solution Steps**:
1. Installed gitlab-runner via chocolatey: `choco install gitlab-runner`
2. Registered with: `gitlab-runner register` and selected `shell` executor
3. Started runner with: `gitlab-runner run` (must keep terminal window open)
4. Verified with: `gitlab-runner verify`

**Key Learnings**:
- `shell` executor runs on local machine directly (no Docker isolation)
- Terminal window running `gitlab-runner run` must stay open
- Runner shows "offline" if terminal is closed; shows "online" when running
- All dependencies must be pre-installed on the machine (pip, npm, etc.)

### 7. **Coverage Reports Not Generating**
**Problem**: CI logs showed warnings about missing coverage files even though tests passed:
```
WARNING: backend/coverage_report/: no matching files.
WARNING: backend/coverage.xml: no matching files.
```

**Status**: Still investigating. Possible causes:
- Pytest might not be running full commands
- Coverage files generated but not in expected paths
- Working directory mismatch between local and CI

**Debugging Steps Needed**:
- View full pytest output to confirm tests execute
- Run locally: `pytest tests/ --cov=. --cov-report=html:coverage_report` to verify reports generate
- Check if pytest is even being invoked

---

## Best Practices Going Forward

1. **Test Files**: Keep tests close to code (in `tests/` subdirectories)
2. **Fixtures**: Use pytest fixtures for reusable test setup
3. **.gitignore**: Always include auto-generated directories before committing
4. **Configuration**: Use environment variables for environment-specific settings (API URLs, keys)
5. **CI Platform-Awareness**: Remember different CI runners (shell, Docker) have different requirements
6. **Coverage Reports**: Verify reports generate locally before expecting them in CI
7. **Windows CI**: Use `python -m` prefix for pip commands on Windows executors

---

## Future Improvements

- [ ] Set up code coverage thresholds (e.g., require 80%+ coverage for PRs)
- [ ] Add integration tests for full API flows
- [ ] Add E2E tests for critical user journeys
- [ ] Set up branch protection rules requiring passing tests
- [ ] Investigate and fix coverage report generation in CI
- [ ] Consider upgrading to cloud-based runners (more reliable than local shell)
