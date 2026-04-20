import {test as setup} from '../../fixtures/base.fixture'
import * as fs from 'fs'
import { AUTH_PATHS, AUTH_ROLES } from '../../config/auth.config'
import { SELECTORS } from '../../pages/registration.page'

// ============ AUTH SETUP ============

AUTH_ROLES.forEach(role => {
    setup(`authenticate ${role.nameRole}`, async ({page, loginPage}) => {
        const hasSavedState = fs.existsSync(role.filePath)
        if (hasSavedState) {
            const storageState = JSON.parse(fs.readFileSync(role.filePath, 'utf-8'))
            await page.context().addCookies(storageState.cookies || [])
        }

        if (!fs.existsSync(AUTH_PATHS.googleState)) {
            throw new Error(`Google auth state not found. Please run:\n  npx playwright codegen --save-storage=${AUTH_PATHS.googleState}\n\nThen login to your Google account and close the browser.`)
        }
        const googleState = JSON.parse(fs.readFileSync(AUTH_PATHS.googleState, 'utf-8'))
        await page.context().addCookies(googleState.cookies || [])

        await page.goto('/')

        const alreadyLoggedIn = await page
            .waitForSelector(SELECTORS.mySummary, { timeout: hasSavedState ? 5000 : 2000 })
            .then(() => true)
            .catch(() => false)

        if (alreadyLoggedIn) return

        await loginPage.loginOnCurrentPage({ username: role.username, password: role.password })
        await page.waitForSelector(SELECTORS.mySummary)
        await page.context().storageState({ path: role.filePath })
    })
})
