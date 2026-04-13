import { COMMON_TIMEOUTS } from '../common.data';

export const KNOWLEDGE_BASE_CONFIG = {
    urls: {
        generalSettings: '/settings/general',
        knowledgeBases: '/settings/general?expanded=KNOWLEDGE_BASES',
    },

    timeouts: COMMON_TIMEOUTS,

    sourceTypeIndex: {
        website: 0,
        text: 1,
        api: 2,
        file: 3,
    },

    selectors: {
        aiKnowledgeBaseText: 'AI Knowledge Base',
        createKnowledgeBaseButton: 'Create Knowledge Base',
        createKnowledgeSourceButton: 'Create Knowledge Source',
        createButton: 'Create',
        confirmButton: 'Confirm',
        deleteAriaLabel: 'Delete',
        searchPlaceholder: 'Search Knowledge Base Names...',
        confirmDeleteText: 'delete knowledge base',
        readyStatus: 'Ready (Up-to-Date)',
        addParameterButton: 'Add Parameter',
        parameterNamePlaceholder: 'Enter Parameter Name...',
        parameterValuePlaceholder: 'Enter Parameter Value...',
    },

    messages: {
        knowledgeSourceCreated: 'Knowledge source has been created successfully',
        knowledgeBaseCreated: 'knowledge base has been created',
        knowledgeBaseInProgress: 'Knowledge Base is in the process of being created',
        knowledgeBaseDeleted: 'Knowledge Base has been Deleted',
    },

    testData: {
        textContent:
            'In the beginning, the universe was created. This has made a lot of people very angry ' +
            "and has been widely regarded as a bad move. Many were increasingly of the opinion that they'd " +
            'all made a big mistake in coming down from the trees in the first place. And some said that ' +
            'even the trees had been a bad move, and that no one should ever have left the oceans.',
        apiUrl: 'https://jsonplaceholder.typicode.com/posts?userId=1',
        apiHeaderName: 'Accept',
        apiHeaderValue: 'application/json',
        websiteUrl: 'https://vancouver.ca/',
        crawlMaxDepth: '5',
        uploadFilePath: 'data/knowledgeBase/Short_Story_About_Vancouver.docx',
    },
} as const;

export type KnowledgeBaseConfig = typeof KNOWLEDGE_BASE_CONFIG;
