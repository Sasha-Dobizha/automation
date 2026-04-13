import { Factory } from 'rosie';

export interface AgentData {
    agentName: string;
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
    return `${hh}:${mm}:${ss}`;
}

export const newAgent = Factory.define<AgentData>('newAgent')
    .attr('agentName', () => `test agent ${dateStamp()} ${timeStamp()}`)
    .attr('tag', 'automation')
    .attr(
        'ticketName',
        () => `ST created by Agent on ${dateStamp()} ${timeStamp()}`,
    );
