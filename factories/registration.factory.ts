import { faker } from '@faker-js/faker';
import { Factory } from 'rosie';
import { REGISTRATION_CONFIG } from '../data/registration.data';

export interface RegistrationData {
    firstName: string;
    lastName: string;
    email: string;
    companyName: string;
    phoneNumber: string;
    jobTitle: string;
}

const { testData } = REGISTRATION_CONFIG;

/**
 * Factory that generates registration data with Gmail+ alias for email verification
 * Gmail supports + aliases: yourname+test123@gmail.com goes to yourname@gmail.com
 * All emails go to the configured verification account inbox
 */
export const newRegistrationWithEmailVerification = Factory.define<RegistrationData>('newRegistrationWithEmailVerification')
    .attr('firstName', () => `${testData.firstNamePrefix}${faker.string.alpha({ length: 5, casing: 'mixed' })}`)
    .attr('lastName', () => `${testData.lastNamePrefix}${faker.string.alpha({ length: 5, casing: 'mixed' })}`)
    .attr('email', () => {
        const timestamp = Date.now();
        const [localPart, domain] = testData.gmailVerificationAccount.split('@');
        return `${localPart}+reg${timestamp}@${domain}`;
    })
    .attr('companyName', () => `${testData.companyPrefix}${faker.string.alphanumeric(8)}`)
    .attr('phoneNumber', () => {
        const areaCode = faker.string.numeric(3);
        const prefix = faker.string.numeric(3);
        const lineNumber = faker.string.numeric(4);
        return `${testData.phoneCountryCode}${areaCode}${prefix}${lineNumber}`;
    })
    .attr('jobTitle', () => faker.person.jobTitle());
