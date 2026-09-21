import { test, expect } from '../../fixtures/electron-fixture'
import { launchCalbyApp } from '../../helpers/electron-app'

test.describe('Phase 5 ? Personal Memory Feature Tests', () => {
  // Helper to clean memories before test
  async function clearAllMemories(page: any) {
    await page.evaluate(async () => {
      if (window.calby?.memory) {
        const res = await window.calby.memory.list()
        if (res.ok) {
          for (const m of res.data) {
            await window.calby.memory.delete(m.id)
          }
        }
      }
    })
  }

  test('1. Memory page navigation and empty state', async ({ calbyPage }) => {
    await clearAllMemories(calbyPage)

    // Navigate from Home to Memory
    const memoryNavBtn = calbyPage.locator('button[aria-label="Memory"]')
    await expect(memoryNavBtn).toBeVisible()
    await memoryNavBtn.click()

    // Verify Memory Page is displayed
    const memoryPage = calbyPage.locator('[data-testid="memory-page"]')
    await expect(memoryPage).toBeVisible()
    await expect(calbyPage.locator('h1:has-text("Personal Memory")')).toBeVisible()

    // Verify Empty state
    const emptyState = calbyPage.locator('[data-testid="memory-empty-state"]')
    await expect(emptyState).toBeVisible()
    await expect(calbyPage.locator('text=No memories saved yet')).toBeVisible()

    // Back to Home
    await calbyPage.click('[data-testid="back-to-home-button"]')
    await expect(memoryNavBtn).toBeVisible()
  })

  test('2. Create memory with form validation and category types', async ({ calbyPage }) => {
    await clearAllMemories(calbyPage)

    // Navigate to Memory
    await calbyPage.click('button[aria-label="Memory"]')

    // Open Add Memory modal
    await calbyPage.click('[data-testid="add-memory-button"]')
    const modal = calbyPage.locator('[data-testid="create-memory-modal"]')
    await expect(modal).toBeVisible()

    // Test empty submission validation
    await calbyPage.click('[data-testid="save-memory-button"]')
    const errorAlert = calbyPage.locator('[data-testid="create-memory-error"]')
    await expect(errorAlert).toBeVisible()
    await expect(errorAlert).toContainText('Please enter memory content')

    // Fill valid content and select 'Work' category
    await calbyPage.fill('[data-testid="memory-content-input"]', 'Rahul handles the payment module')
    await calbyPage.click('[data-testid="type-select-work"]')
    await calbyPage.click('[data-testid="save-memory-button"]')

    // Verify modal closes and card appears
    await expect(modal).not.toBeVisible()
    const memoryCard = calbyPage.locator('[data-testid="memory-card"]').first()
    await expect(memoryCard).toBeVisible()
    await expect(memoryCard.locator('[data-testid="memory-content"]')).toContainText('Rahul handles the payment module')
    await expect(memoryCard.locator('[data-testid="memory-type-badge"]')).toContainText('Work')
  })

  test('3. Search and category filter', async ({ calbyPage }) => {
    await clearAllMemories(calbyPage)

    // Navigate to Memory
    await calbyPage.click('button[aria-label="Memory"]')

    // Create 3 memories with different types
    await calbyPage.click('[data-testid="add-memory-button"]')
    await calbyPage.fill('[data-testid="memory-content-input"]', 'Rahul handles the payment module')
    await calbyPage.click('[data-testid="type-select-work"]')
    await calbyPage.click('[data-testid="save-memory-button"]')
    await calbyPage.waitForTimeout(200)

    await calbyPage.click('[data-testid="add-memory-button"]')
    await calbyPage.fill('[data-testid="memory-content-input"]', 'Preferred coffee is flat white with oat milk')
    await calbyPage.click('[data-testid="type-select-preference"]')
    await calbyPage.click('[data-testid="save-memory-button"]')
    await calbyPage.waitForTimeout(200)

    await calbyPage.click('[data-testid="add-memory-button"]')
    await calbyPage.fill('[data-testid="memory-content-input"]', 'Sarah is the lead iOS engineer')
    await calbyPage.click('[data-testid="type-select-person"]')
    await calbyPage.click('[data-testid="save-memory-button"]')
    await calbyPage.waitForTimeout(200)

    // Should have 3 cards visible
    await expect(calbyPage.locator('[data-testid="memory-card"]')).toHaveCount(3)

    // Search for "Rahul"
    await calbyPage.fill('[data-testid="memory-search-input"]', 'Rahul')
    await calbyPage.waitForTimeout(200)
    await expect(calbyPage.locator('[data-testid="memory-card"]')).toHaveCount(1)
    await expect(calbyPage.locator('[data-testid="memory-content"]')).toContainText('Rahul handles the payment module')

    // Clear search
    await calbyPage.click('button:has-text("Clear")')
    await calbyPage.waitForTimeout(200)
    await expect(calbyPage.locator('[data-testid="memory-card"]')).toHaveCount(3)

    // Filter by Preference tab
    await calbyPage.click('[data-testid="filter-tab-preference"]')
    await calbyPage.waitForTimeout(200)
    await expect(calbyPage.locator('[data-testid="memory-card"]')).toHaveCount(1)
    await expect(calbyPage.locator('[data-testid="memory-content"]')).toContainText('flat white')
  })

  test('4. Edit and Delete memory lifecycle', async ({ calbyPage }) => {
    await clearAllMemories(calbyPage)

    // Navigate to Memory
    await calbyPage.click('button[aria-label="Memory"]')

    // Create memory
    await calbyPage.click('[data-testid="add-memory-button"]')
    await calbyPage.fill('[data-testid="memory-content-input"]', 'Office gate code is 1234')
    await calbyPage.click('[data-testid="type-select-fact"]')
    await calbyPage.click('[data-testid="save-memory-button"]')
    await calbyPage.waitForTimeout(200)

    // Edit memory
    const card = calbyPage.locator('[data-testid="memory-card"]:has-text("Office gate code is 1234")')
    await card.locator('[data-testid="edit-memory-button"]').click()
    const editModal = calbyPage.locator('[data-testid="edit-memory-modal"]')
    await expect(editModal).toBeVisible()

    await calbyPage.fill('[data-testid="edit-memory-content-input"]', 'Office gate code is 5678')
    await calbyPage.click('[data-testid="save-edit-memory-button"]')
    await expect(editModal).not.toBeVisible()

    const updatedCard = calbyPage.locator('[data-testid="memory-card"]:has-text("Office gate code is 5678")')
    await expect(updatedCard).toBeVisible()

    // Delete memory
    await updatedCard.locator('[data-testid="delete-memory-button"]').click()
    await calbyPage.waitForTimeout(200)

    // Should return to empty state
    await expect(calbyPage.locator('[data-testid="memory-card"]')).toHaveCount(0)
    await expect(calbyPage.locator('[data-testid="memory-empty-state"]')).toBeVisible()
  })

  test('5. Persistence across application restart', async () => {
    let appCtx = await launchCalbyApp()
    let page = appCtx.page

    // Helper to bypass onboarding on fresh app launch
    const ensureOnboarded = async (p: any) => {
      await p.waitForLoadState('domcontentloaded')
      const welcomeBtn = p.locator('button:has-text("Get Started")')
      if (await welcomeBtn.isVisible()) {
        await p.evaluate(async () => {
          if (window.calby?.auth?.validateAndSaveKey) {
            await window.calby.auth.validateAndSaveKey('AIzaSyDeterministicValidKey1234567890')
          }
          if (window.calby?.onboarding?.complete) {
            await window.calby.onboarding.complete()
          }
        })
        await p.reload()
        await p.waitForLoadState('domcontentloaded')
      }
    }

    await ensureOnboarded(page)

    // Clean existing
    await page.evaluate(async () => {
      if (window.calby?.memory) {
        const res = await window.calby.memory.list()
        if (res.ok) {
          for (const m of res.data) {
            await window.calby.memory.delete(m.id)
          }
        }
      }
    })

    // Navigate to Memory & create persistent memory
    await page.click('button[aria-label="Memory"]')
    await page.click('[data-testid="add-memory-button"]')
    await page.fill('[data-testid="memory-content-input"]', 'Database password is not stored in plaintext')
    await page.click('[data-testid="type-select-fact"]')
    await page.click('[data-testid="save-memory-button"]')
    await page.waitForTimeout(400)

    // Close application and preserve userDataDir
    const userDataDir = await appCtx.app.evaluate(({ app }) => app.getPath('userData'))
    await appCtx.app.close()

    // Relaunch application with same userDataDir
    appCtx = await launchCalbyApp({ userDataDir })
    page = appCtx.page
    await ensureOnboarded(page)

    try {
      // Navigate to Memory
      await expect(page.locator('button[aria-label="Memory"]')).toBeVisible()
      await page.click('button[aria-label="Memory"]')

      // Verify stored memory is loaded from SQLite
      const card = page.locator('[data-testid="memory-card"]:has-text("Database password is not stored in plaintext")')
      await expect(card).toBeVisible()
    } finally {
      await appCtx.app.close()
    }
  })

  test('6. Memory IPC channels and search', async ({ calbyPage }) => {
    await clearAllMemories(calbyPage)

    // Test memory IPC directly through window.calby.memory in Renderer
    const result = await calbyPage.evaluate(async () => {
      // 1. Create memory
      const createRes = await window.calby.memory.create({
        content: 'Rahul handles the payment gateway',
        type: 'work'
      })

      // 2. Create another memory
      await window.calby.memory.create({
        content: 'Sarah leads iOS design',
        type: 'person'
      })

      // 3. Search memory
      const searchRes = await window.calby.memory.search('payment')

      // 4. Update memory by ID
      const updateRes = await window.calby.memory.update({
        id: createRes.ok ? createRes.data.id : '',
        content: 'Rahul handles Stripe and PayPal payments',
        type: 'work'
      })

      // 5. Delete memory
      const deleteRes = await window.calby.memory.delete(createRes.ok ? createRes.data.id : '')

      return {
        createOk: createRes.ok,
        searchCount: searchRes.ok ? searchRes.data.length : 0,
        updateOk: updateRes.ok,
        deleteOk: deleteRes.ok
      }
    })

    expect(result.createOk).toBe(true)
    expect(result.searchCount).toBe(1)
    expect(result.updateOk).toBe(true)
    expect(result.deleteOk).toBe(true)
  })

  test('7. Cross-navigation between Home, Reminders, Calendar, and Memory', async ({ calbyPage }) => {
    // 1. Home -> Memory
    await calbyPage.click('button[aria-label="Memory"]')
    await expect(calbyPage.locator('h1:has-text("Personal Memory")')).toBeVisible()

    // 2. Memory -> Calendar
    await calbyPage.click('[data-testid="memory-nav-calendar-button"]')
    await expect(calbyPage.locator('h1:has-text("Calendar & Schedule")')).toBeVisible()

    // 3. Calendar -> Memory
    await calbyPage.click('[data-testid="calendar-nav-memory-button"]')
    await expect(calbyPage.locator('h1:has-text("Personal Memory")')).toBeVisible()

    // 4. Memory -> Reminders
    await calbyPage.click('[data-testid="memory-nav-reminders-button"]')
    await expect(calbyPage.locator('h1:has-text("Reminders")')).toBeVisible()

    // 5. Reminders -> Memory
    await calbyPage.click('[data-testid="reminders-nav-memory-button"]')
    await expect(calbyPage.locator('h1:has-text("Personal Memory")')).toBeVisible()

    // 6. Memory -> Home
    await calbyPage.click('[data-testid="back-to-home-button"]')
    await expect(calbyPage.locator('button[aria-label="Memory"]')).toBeVisible()
  })
})
