import { faker } from '@faker-js/faker';

export interface CheckoutFormData {
    firstName: string;
    lastName: string;
    dateOfBirth: string;
    phoneNumber: string;
    email: string;
}

const CANADIAN_AREA_CODES = [
    '204', '226', '236', '249', '250', '289', '306', '343', '354', '365',
    '367', '368', '403', '416', '418', '431', '437', '438', '450', '474',
    '506', '514', '519', '548', '579', '581', '587', '604', '613', '639',
    '647', '672', '683', '705', '709', '742', '753', '778', '780', '782',
    '807', '819', '825', '867', '873', '902', '905',
];

export function generatePhoneNumber(): string {
    const areaCode = faker.helpers.arrayElement(CANADIAN_AREA_CODES);
    const exchangeFirst = faker.string.numeric({ length: 1, allowLeadingZeros: false, exclude: ['0', '1'] });
    const exchangeRest = faker.string.numeric(2);
    const lineNumber = faker.string.numeric(4);
    return `${areaCode}${exchangeFirst}${exchangeRest}${lineNumber}`;
}

export function createCheckoutForm(): CheckoutFormData {
    return {
        firstName: 'Testfirst',
        lastName: 'Testlastname',
        dateOfBirth: '1988-12-04',
        phoneNumber: generatePhoneNumber(),
        email: 'test.automation@mailinator.com',
    };
}
