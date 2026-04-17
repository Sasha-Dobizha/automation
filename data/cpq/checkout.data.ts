import { faker } from '@faker-js/faker';

export interface CheckoutFormData {
    firstName: string;
    lastName: string;
    dateOfBirth: string;
    phoneNumber: string;
    email: string;
}

export function generatePhoneNumber(): string {
    const prefix = faker.string.numeric(3);
    const lineNumber = faker.string.numeric(4);
    return `604${prefix}${lineNumber}`;
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
