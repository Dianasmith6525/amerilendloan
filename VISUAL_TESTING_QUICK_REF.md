# Visual Testing Quick Reference 🎯

## Common Commands

```bash
# First-time setup
npx playwright install

# Run tests interactively (best for development)
npm run test:visual:ui

# Run all tests (command line)
npm run test:visual

# Update baseline screenshots (after intentional UI changes)
npm run test:visual:update

# View last test report
npm run test:visual:report

# Run specific test file
npx playwright test tests/visual/homepage.spec.ts

# Run specific browser
npx playwright test --project=chromium

# Debug mode
npx playwright test --debug
```

## File Locations

- **Test Files**: `tests/visual/*.spec.ts`
- **Config**: `playwright.config.ts`
- **Baselines**: `tests/visual/*-snapshots/` (commit these!)
- **Reports**: `playwright-report/` (ignored by git)

## When to Run Tests

✅ **Before committing** UI changes
✅ **After refactoring** CSS/components
✅ **Before merging** pull requests
✅ **When updating** design system
✅ **In CI/CD** pipeline

## Test Coverage

- 30 test cases
- 6 browsers/devices
- 180 total scenarios

## Quick Workflow

1. Make UI changes
2. `npm run test:visual:ui`
3. Review diffs
4. Update baselines if intentional
5. Commit code + screenshots

## Need Help?

- Full docs: `tests/visual/README.md`
- Setup guide: `VISUAL_TESTING_SETUP.md`
- Implementation: `VISUAL_TESTING_IMPLEMENTATION.md`
