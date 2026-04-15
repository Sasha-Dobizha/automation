import {defineConfig, devices} from '@playwright/test';
import { COMMON_TIMEOUTS } from './data/common.data';

require('dotenv').config({path: '.env'});

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
    timeout: COMMON_TIMEOUTS.long,
    testDir: './tests',
    retries: process.env.CI ? 1 : 0,
    workers: process.env.CI ? 2 : 3,
    reporter: [
        ['junit', {outputFile: 'test_results.xml'}],
        ['html'],
        ['./reporters/performance-reporter.ts', { outputDir: 'performance-report' }],
    ],
    /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
    use: {
        baseURL: process.env.BASE_URL,
        ignoreHTTPSErrors: true,
        trace: 'on-first-retry',
        screenshot: 'only-on-failure',
        headless: true,  // Set headless mode here
        contextOptions: {
            permissions: ['clipboard-read', 'clipboard-write'],
        },
        video: {
            mode: 'retain-on-failure',
            size: { width: 1280, height: 720 }
        }
    },
    /* Configure projects for major browsers */
    projects: [
        {
            name: 'setup',
            testMatch: /.*\.setup\.ts/,
        },

        {
            name: 'chromium',
            use: {
                ...devices['Desktop Chrome'],
                storageState: '.auth/adminState.json',
                launchOptions: {
                    slowMo: 500,
                    args: [
                        '--disable-blink-features=AutomationControlled',
                        '--disable-features=IsolateOrigins,site-per-process',
                    ]
                }
            },
            dependencies: ['setup'],
        },
        // {
        //     name: 'chromium',
        //     use: {...devices['Desktop Chrome']
        //     },
        //     dependencies: ['setup'],
        // },

        // {
        //   name: 'firefox',
        //   use: { ...devices['Desktop Firefox'] },
        //   dependencies: ['setup'],
        // },
        //
        // {
        //   name: 'webkit',
        //   use: { ...devices['Desktop Safari'] },
        //   dependencies: ['setup'],
        // },

        /* Test against mobile viewports. */
        // {
        //   name: 'Mobile Chrome',
        //   use: { ...devices['Pixel 5'] },
        // },
        // {
        //   name: 'Mobile Safari',
        //   use: { ...devices['iPhone 12'] },
        // },

        /* Test against branded browsers. */
        // {
        //   name: 'Microsoft Edge',
        //   use: { ...devices['Desktop Edge'], channel: 'msedge' },
        // },

    ],

    /* Run your local dev server before starting the tests */
    // webServer: {
    //   command: 'npm run start',
    //   url: 'http://127.0.0.1:3000',
    //   reuseExistingServer: !process.env.CI,
    // },
});
