import { Factory } from 'rosie';

export interface ServiceTicketTypeData {
    typeName: string;
    actionName: string;
    successMessage: string;
    errorMessage: string;
}

export interface ServiceTicketData {
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

export const newServiceTicketType = Factory.define<ServiceTicketTypeData>('newServiceTicketType')
    .attr('typeName', () => `ST Type ${dateStamp()} ${timeStamp()}`)
    .attr('actionName', () => `Test Action ${dateStamp()} ${timeStamp()}`)
    .attr('successMessage', 'Action executed successfully.')
    .attr('errorMessage', 'Something went wrong. Please try again later.');

export const newServiceTicket = Factory.define<ServiceTicketData>('newServiceTicket')
    .attr('ticketName', () => `Service Ticket ${dateStamp()} ${timeStamp()}`);
