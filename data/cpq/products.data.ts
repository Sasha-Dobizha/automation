import type { ProductSelectionConfig } from '../../pages/cpq/cpq.page';

export const PRODUCT_SELECTIONS: ProductSelectionConfig = {
    internet: {
        plan: 'Internet 1000',
        equipment: 'Router Rental WiFi 7 - Upgrade',
        addons: ['Mesh Rental'],
    },
    tv: {
        plan: 'TV Intro',
        equipment: 'IPTV PVR Rental',
        packageAddons: ['Adventure', 'Canadian Time Shift'],
        individualChannels: ['AXS TV HD', 'H2 HD', 'Zee TV Canada'],
    },
    phone: {
        addons: [
            'North America 500',
            'Unlimited India',
            'Unlimited Asia',
            'Unlimited North America',
        ],
    },
};

export const SUCCESS_TOAST = 'The add-ons were successfully added to the plan in your cart';
export const EXPECTED_CART_COUNT = 3;
