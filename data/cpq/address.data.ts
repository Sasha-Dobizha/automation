import { COMMON_TIMEOUTS } from '../common.data';
 
export const ADDRESSES: Array<{ address: string; amsId: string }> = [
    { address: '1008 Cambie St. #502, Vancouver, BC V6B 6J7, Canada', amsId: '220' },
    //{ address: '1325 Rolston St #203, Vancouver, BC V6B 0M2, Canada', amsId: '656' },
];

export const ADDRESS_CONFIG = {
    urls: {
        cpqBaseUrl: process.env.CPQ_BASE_URL || '',
    },

    timeouts: COMMON_TIMEOUTS,
} as const;
 
export type AddressConfig = typeof ADDRESS_CONFIG;