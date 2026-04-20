export const COMMON_TIMEOUTS = {
    short: 10000,
    standard: 45000,
    long: 120000,
    // short: 40000,
    // standard: 100000,
    // long: 180000,
} as const;

export const COMMON_URLS = {
    baseUrl: (process.env.BASE_URL || '').replace(/\/+$/, ''),
} as const;

export const GLDS_CONFIG = {
    baseUrl: 'https://216.19.176.49:16920/customer-experience-gateway/v1',
    username: 'S1mply_A2k',
    get password() { return process.env.GLDS_PASSWORD ?? ''; },
} as const;

export type CommonTimeouts = typeof COMMON_TIMEOUTS;
export type CommonUrls = typeof COMMON_URLS;
