import { COMMON_TIMEOUTS } from '../common.data';

export const GENERAL_SETTINGS_CONFIG = {
    urls: {
        generalSettings: '/settings/general',
    },

    timeouts: COMMON_TIMEOUTS,

    selectors: {
        organizationDetailsText: 'Organization Details',
        editProfileButton: 'Edit Profile',
        saveButton: 'Save',
    },

    messages: {
        phoneValidationError: 'Enter the number in the +1 222-333-4444 format',
        successTitle: 'Success',
        organizationUpdatedSuccess: 'Organization information has been updated successfully',
    },

    testData: {
        invalidPhoneNumbers: {
            tooShort: '+1 236 272',
        },
    },
} as const;

export type GeneralSettingsConfig = typeof GENERAL_SETTINGS_CONFIG;

/**
 * Generates a random valid phone number in the format +1 XXX XXX XXXX
 */
export function generateRandomPhoneNumber(): string {
    const areaCode = Math.floor(200 + Math.random() * 800).toString();
    const prefix = Math.floor(200 + Math.random() * 800).toString();
    const lineNumber = Math.floor(1000 + Math.random() * 9000).toString();
    return `+1 ${areaCode} ${prefix} ${lineNumber}`;
}
