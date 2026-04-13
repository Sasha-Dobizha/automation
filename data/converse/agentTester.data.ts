import { COMMON_TIMEOUTS } from '../common.data';

export const AGENT_TESTER_CONFIG = {
    urls: {
        agentTester: '/converse/agent-tester',
        liveChat: '/converse/live-chat',
    },

    timeouts: {
        ...COMMON_TIMEOUTS,
        chatResponse: 60000,
    },

    messages: {
        greeting:
            'Hi, I am an automated regression test. How can I help you?',
        proceedPrompt: 'Do you want me to proceed?',
        ticketCreatedPattern:
            /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i,
        processComplete:
            /all set|everything is ready|process.*completed|completed.*successfully|done|been processed/i,
        transferToAgentResponse: 'How can I assist you today?',
        transferToHumanMemory: 'We found the following parameters in memory',
        transferringToLiveSupport:
            'Transferring conversation to live support',
        liveAgentConnected: 'Live agent is now connected',
    },

    chatPrompts: {
        serviceTicket: 'create',
        invokeApi: 'execute api',
        executeProcess: 'process',
        transferToAgent: 'Transfer to Agent',
        transferToHuman: 'Transfer to Human',
        queryKnowledgeBase: 'query knowledge base',
        confirm: 'yes',
    },

} as const;

export type AgentTesterConfig = typeof AGENT_TESTER_CONFIG;
