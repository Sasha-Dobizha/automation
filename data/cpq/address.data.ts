import { COMMON_TIMEOUTS } from '../common.data';
 
export const ADDRESS_CONFIG = {
    urls: {
        cpqBaseUrl: process.env.CPQ_BASE_URL || '',
    },
 
    timeouts: COMMON_TIMEOUTS,
 
    testData: {
        addresses: [
            '1008 Cambie St. #502, Vancouver, BC V6B 6J7, Canada',
        ],
    },
} as const;
 
export type AddressConfig = typeof ADDRESS_CONFIG;