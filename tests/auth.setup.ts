import {test as setup} from '../fixtures/base.fixture'
import * as fs from 'fs'
import { AUTH_PATHS, AUTH_ROLES } from '../config/auth.config'
import { SELECTORS } from '../pages/registration.page'

// ============ AUTH SETUP ============

AUTH_ROLES.forEach(role => {
    setup(`authenticate ${role.nameRole}`, async ({page, loginPage}) => {
        if (fs.existsSync(role.filePath)) {
            const storageState = JSON.parse(fs.readFileSync(role.filePath, 'utf-8'))
            await page.context().addCookies(storageState.cookies || [])
            await page.goto('/')
            try {
                await page.waitForSelector(SELECTORS.mySummary, { timeout: 10000 })
                return
            } catch {
                // Auth state expired, need to re-login
            }
        }
        if (!fs.existsSync(AUTH_PATHS.googleState)) {
            throw new Error(`Google auth state not found. Please run:\n  npx playwright codegen --save-storage=${AUTH_PATHS.googleState}\n\nThen login to your Google account and close the browser.`)
        }
        const googleState = JSON.parse(fs.readFileSync(AUTH_PATHS.googleState, 'utf-8'))
        await page.context().addCookies(googleState.cookies || [])
        await loginPage.loginToApp({ username: role.username, password: role.password })
        await page.waitForSelector(SELECTORS.mySummary)
        await page.context().storageState({ path: role.filePath })
    })
})



