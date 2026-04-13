// ============ AUTH CONFIG ============

export const AUTH_PATHS = {
    googleState: '.auth/googleState.json',
    adminState: '.auth/adminState.json',
} as const

export const SELECTORS = {
    mySummary: 'a[name="My Summary"]',
} as const

export const AUTH_ROLES = [
    {
        nameRole: 'admin',
        filePath: AUTH_PATHS.adminState,
        username: process.env.ADMIN_COMPANY_USERNAME,
        password: process.env.ADMIN_COMPANY_PASSWORD,
        googleUsername: process.env.GOOGLE_TEST_USER_EMAIL,
        googlePassword: process.env.GOOGLE_TEST_USER_PASSWORD,
    },
] as const

export type AuthRole = typeof AUTH_ROLES[number]
