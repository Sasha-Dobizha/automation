import { Factory } from 'rosie';

export interface KnowledgeBaseData {
    kbName: string;
    ksName: string;
}

function formatTimestamp(): string {
    const now = new Date();
    return now.toLocaleString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
    });
}

export const newKnowledgeBase = Factory.define<KnowledgeBaseData>('newKnowledgeBase')
    .option('sourceType', 'Text')
    .attr('kbName', ['sourceType'], (type: string) => `KB ${type} ${formatTimestamp()}`)
    .attr('ksName', ['sourceType'], (type: string) => `KS ${type} ${formatTimestamp()}`);
