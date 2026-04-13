import { faker } from '@faker-js/faker';
import { Factory } from 'rosie';

export interface InviteUserData {
    firstName: string;
    lastName: string;
    email: string;
    timezone: string;
}

export const newInviteUser = Factory.define<InviteUserData>('newInviteUser')
    .attr('firstName', () => faker.string.alpha({ length: 8, casing: 'mixed' }))
    .attr('lastName', () => faker.string.alpha({ length: 10, casing: 'mixed' }))
    .attr('email', () => {
        const timestamp = Date.now();
        const randomString = faker.string.alphanumeric(6);
        return `testuser+${timestamp}${randomString}@fakeemail.test`;
    })
    .attr('timezone', 'America/Vancouver');
