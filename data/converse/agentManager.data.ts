import { COMMON_TIMEOUTS } from '../common.data';
import { KNOWLEDGE_BASE_CONFIG } from '../knowledgeBase/knowledgeBase.data';

export const AGENT_MANAGER_CONFIG = {
    urls: {
        agentManager: '/converse/manager',
        knowledgeBases: KNOWLEDGE_BASE_CONFIG.urls.knowledgeBases,
    },

    timeouts: COMMON_TIMEOUTS,

    actionTypeIndex: {
        serviceTicket: 0,
        queryKnowledgeBase: 1,
        executeProcess: 2,
        invokeApi: 3,
        transferToAgent: 4,
        transferToHuman: 5,
    },

    selectors: {
        newAgentButton: 'New Agent',
        confirmButton: 'Confirm',
        deployButton: 'Deploy',
        addActionButton: 'Add Action',
        addParameterButton: 'Add Parameter',
        searchPlaceholder: 'Search',
        editAgentText: 'Edit Agent',
        agentNameInput: 'name',
        greetingPlaceholder: 'Enter guidance...',
        objectiveNamePlaceholder: 'Enter Objective Name...',
        actionNamePlaceholder: 'Enter Action Name...',
        requestUrlPlaceholder: 'e.g: abc/abc/abc/123',
        parameterNamePlaceholder: 'Parameter Name...',
        parameterValuePlaceholder: 'Parameter Value...',
        issueNameInput: 'issueName',
    },

    messages: {
        agentCreated: (name: string) => `Agent "${name}" was created!`,
        agentDeployed: (name: string) => `${name} has been deployed successfully.`,
    },

    breadcrumbs: {
        converse: 'Converse',
        agentManager: 'Agent Manager',
        newAgent: 'New Agent',
    },

    testData: {
        tag: 'automation',
        greeting:
            'say "Hi, I am an automated regression test. How can I help you?"',
        objectiveName: 'create service ticket',
        serviceTicketActionName: 'create',
        ticketType: 'Service Ticket',
        invokeApiActionName: 'execute api',
        requestMethod: 'GET',
        apiUrl: KNOWLEDGE_BASE_CONFIG.testData.apiUrl,
        apiHeaderName: KNOWLEDGE_BASE_CONFIG.testData.apiHeaderName,
        apiHeaderValue: KNOWLEDGE_BASE_CONFIG.testData.apiHeaderValue,
        queryKBActionName: 'query knowledge base',
        knowledgeBaseName: 'Symphona All Docs',
        executeProcessActionName: 'process',
        processName: 'Automation Process',
        transferToAgentActionName: 'Transfer to Agent',
        transferToHumanActionName: 'Transfer to Human',
    },
} as const;

export type AgentManagerConfig = typeof AGENT_MANAGER_CONFIG;
