import { faker } from '@faker-js/faker';
import { Factory } from 'rosie';

export interface ProcessData {
    name: string;
    description: string;
    tag: string;
    ticketName: string;
}

function dateStamp(): string {
    return new Date().toISOString().slice(0, 10);
}

function timeStamp(): string {
    const now = new Date();
    const hh = String(now.getHours()).padStart(2, '0');
    const mm = String(now.getMinutes()).padStart(2, '0');
    const ss = String(now.getSeconds()).padStart(2, '0');
    return `${hh}-${mm}-${ss}`;
}

function processName(): string {
    const word = faker.word.noun();
    const capitalized = word.charAt(0).toUpperCase() + word.slice(1);
    return `${capitalized} ${dateStamp()} ${timeStamp()}`;
}

export const newProcess = Factory.define<ProcessData>('newProcess')
    .attr('name', () => processName())
    .attr('description', () => faker.lorem.sentence())
    .attr('tag', 'automation')
    .attr('ticketName', () => `Ticket-${dateStamp()}-${timeStamp()}`);
