import { faker } from '@faker-js/faker';
import { Factory } from 'rosie';

export interface UserGroupData {
    name: string;
    description: string;
}

export const newUserGroup = Factory.define<UserGroupData>('newUserGroup')
    .attr('name', () => {
        const timestamp = Date.now();
        const randomString = faker.string.alpha({ length: 5, casing: 'mixed' });
        return `AutoTest_${randomString}_${timestamp}`;
    })
    .attr('description', () => faker.lorem.sentence());
