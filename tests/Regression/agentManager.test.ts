import { test } from '../../fixtures/base.fixture';
import { AUTH_PATHS } from '../../config/auth.config';
import { newAgent, type AgentData } from '../../factories/agentManager.factory';
import { AGENT_TESTER_CONFIG } from '../../data/converse/agentTester.data';
import { AGENT_MANAGER_CONFIG } from '../../data/converse/agentManager.data';

const { messages: chatMessages, chatPrompts } = AGENT_TESTER_CONFIG;

test.describe('Converse - Agent Manager', () => {
    test.use({ storageState: AUTH_PATHS.adminState });

    const agentData: AgentData = newAgent.build();
    let agentCreated = false;

    test('Create Agent', async ({ agentManagerPage }) => {
        await agentManagerPage.createAgent(
            agentData.agentName,
            agentData.tag,
        );
        agentCreated = true;
    });

    // --- Greeting + Initiate Chat ---

    test.describe.serial('Greeting and Chat Init', () => {
        test.beforeEach(() => {
            test.skip(!agentCreated, 'Skipped: Create Agent failed');
        });

        test('Set greeting and objective', async ({ agentManagerPage }) => {
            await agentManagerPage.configureGreetingAndObjective(
                agentData.agentName,
            );
        });

        test('Initiate the chat conversation', async ({
            agentTesterPage,
        }) => {
            await agentTesterPage.initiateChat(agentData.agentName);
        });
    });

    // --- Service Ticket + Chat ---

    test.describe.serial('Service Ticket', () => {
        test.beforeEach(() => {
            test.skip(!agentCreated, 'Skipped: Create Agent failed');
        });

        test('Configure agent for action Service Ticket', async ({
            agentManagerPage,
        }) => {
            await agentManagerPage.configureServiceTicketAction(
                agentData.agentName,
                agentData.ticketName,
            );
        });

        test('Chat with an agent - create Service ticket', async ({
            agentTesterPage,
        }) => {
            await agentTesterPage.initiateChat(agentData.agentName);

            await test.step('Send "create" message', async () => {
                await agentTesterPage.sendMessage(chatPrompts.serviceTicket);
            });

            await test.step('Verify proceed prompt', async () => {
                await agentTesterPage.waitForChatResponse(
                    chatMessages.proceedPrompt,
                );
            });

            await test.step('Confirm with "yes"', async () => {
                await agentTesterPage.sendMessage(chatPrompts.confirm);
            });

            await test.step('Verify ticket creation response', async () => {
                await agentTesterPage.waitForChatResponse(
                    chatMessages.ticketCreatedPattern,
                );
            });
        });
    });

    // --- Invoke API + Chat ---

    test.describe.serial('Invoke API', () => {
        test.beforeEach(() => {
            test.skip(!agentCreated, 'Skipped: Create Agent failed');
        });

        test('Configure agent for action Invoke API', async ({
            agentManagerPage,
        }) => {
            await agentManagerPage.configureInvokeApiAction(
                agentData.agentName,
            );
        });

        test('Chat with an agent - API', async ({ agentTesterPage }) => {
            await agentTesterPage.initiateChat(agentData.agentName);

            await test.step('Send "execute api" message', async () => {
                await agentTesterPage.sendMessage(chatPrompts.invokeApi);
            });

            await test.step('Verify proceed prompt', async () => {
                await agentTesterPage.waitForChatResponse(
                    chatMessages.proceedPrompt,
                );
            });

            await test.step('Confirm with "yes"', async () => {
                await agentTesterPage.sendMessage(chatPrompts.confirm);
            });

            await test.step('Verify API response contains data', async () => {
                await agentTesterPage.waitForChatResponse('"userId": 1');
            });
        });
    });


    // --- Execute Process + Chat ---

    test.describe.serial('Execute Process', () => {
        test.beforeEach(() => {
            test.skip(!agentCreated, 'Skipped: Create Agent failed');
        });

        test('Configure agent for action Execute Process', async ({
            agentManagerPage,
        }) => {
            await test.step(
                'Prerequisite: Ensure Process exists',
                async () => {
                    await agentManagerPage.ensureProcessExists();
                },
            );

            await agentManagerPage.configureExecuteProcessAction(
                agentData.agentName,
            );
        });

        test('Chat with an agent - Process', async ({
            agentTesterPage,
            processManagerPage,
        }) => {
            await agentTesterPage.initiateChat(agentData.agentName);

            await test.step('Send "process" message', async () => {
                await agentTesterPage.sendMessage(chatPrompts.executeProcess);
            });

            await test.step('Verify proceed prompt', async () => {
                await agentTesterPage.waitForChatResponse(
                    chatMessages.proceedPrompt,
                );
            });

            await test.step('Confirm with "yes"', async () => {
                await agentTesterPage.sendMessage(chatPrompts.confirm);
            });

            await test.step('Verify process complete response', async () => {
                await agentTesterPage.waitForChatResponse(
                    chatMessages.processComplete,
                );
            });

            await test.step('Navigate to Process History', async () => {
                await processManagerPage.navigateToProcessHistory();
            });

            await test.step(
                'Search for process in Process History',
                async () => {
                    await processManagerPage.searchProcessHistory(
                        AGENT_MANAGER_CONFIG.testData.processName,
                    );
                },
            );

            await test.step(
                'Verify process execution status is Success',
                async () => {
                    await processManagerPage.verifyProcessExecutionStatus(
                        'Success',
                    );
                },
            );
        });
    });

    // --- Transfer to Agent + Chat ---

    test.describe.serial('Transfer to Agent', () => {
        test.beforeEach(() => {
            test.skip(!agentCreated, 'Skipped: Create Agent failed');
        });

        test('Configure agent for action Transfer to Agent', async ({
            agentManagerPage,
        }) => {
            await agentManagerPage.configureTransferToAgentAction(
                agentData.agentName,
            );
        });

        test('Chat with an agent - Transfer to Agent', async ({
            agentTesterPage,
        }) => {
            await agentTesterPage.initiateChat(agentData.agentName);

            await test.step(
                'Send "Transfer to Agent" message',
                async () => {
                    await agentTesterPage.sendMessage(
                        chatPrompts.transferToAgent,
                    );
                },
            );

            await test.step(
                'Verify transfer to agent response',
                async () => {
                    await agentTesterPage.waitForChatResponse(
                        chatMessages.transferToAgentResponse,
                    );
                },
            );
        });
    });

    // --- Transfer to Human + Chat ---

    test.describe.serial('Transfer to Human', () => {
        test.beforeEach(() => {
            test.skip(!agentCreated, 'Skipped: Create Agent failed');
        });

        test('Configure agent for action Transfer to Human', async ({
            agentManagerPage,
        }) => {
            await agentManagerPage.configureTransferToHumanAction(
                agentData.agentName,
            );
        });

        test('Chat with an agent - Transfer to Human', async ({
            agentTesterPage,
        }) => {
            await agentTesterPage.initiateChat(agentData.agentName);

            await test.step(
                'Send "Transfer to Human" message',
                async () => {
                    await agentTesterPage.sendMessage(
                        chatPrompts.transferToHuman,
                    );
                },
            );

            await test.step(
                'Verify memory parameters response',
                async () => {
                    await agentTesterPage.waitForChatResponse(
                        chatMessages.transferToHumanMemory,
                    );
                },
            );

            await test.step('Confirm using in-memory parameters', async () => {
                await agentTesterPage.sendMessage(chatPrompts.confirm);
            });

            await test.step(
                'Verify transferring to live support',
                async () => {
                    await agentTesterPage.waitForChatResponse(
                        chatMessages.transferringToLiveSupport,
                    );
                },
            );

            await test.step('Navigate to Live Chat', async () => {
                await agentTesterPage.navigateToLiveChat();
            });

            await test.step('Click Requests tab', async () => {
                await agentTesterPage.clickRequestsTab();
            });

            await test.step('Click on the first request', async () => {
                await agentTesterPage.clickFirstRequest();
            });

            await test.step('Accept the request', async () => {
                await agentTesterPage.acceptRequest();
            });

            await test.step('Verify live agent connected', async () => {
                await agentTesterPage.verifyLiveAgentConnected();
            });
        });
    });

        // --- Knowledge Base + Chat ---

        test.describe.serial('Knowledge Base', () => {
            test.beforeEach(() => {
                test.skip(!agentCreated, 'Skipped: Create Agent failed');
            });

            test('Configure agent for action Knowledge Base', async ({
                agentManagerPage,
            }) => {
                await test.step(
                    'Prerequisite: Ensure Knowledge Base exists',
                    async () => {
                        await agentManagerPage.ensureKnowledgeBaseExists();
                    },
                );

                await agentManagerPage.configureQueryKnowledgeBaseAction(
                    agentData.agentName,
                );
            });

            test('Chat with an agent - query knowledge base', async ({
                agentTesterPage,
            }) => {
                await agentTesterPage.initiateChat(agentData.agentName);

                await test.step(
                    'Send "query knowledge base" message',
                    async () => {
                        await agentTesterPage.sendMessage(
                            chatPrompts.queryKnowledgeBase,
                        );
                    },
                );

                await test.step('Verify proceed prompt', async () => {
                    await agentTesterPage.waitForChatResponse(
                        chatMessages.proceedPrompt,
                    );
                });

                await test.step('Confirm with "yes"', async () => {
                    await agentTesterPage.sendMessage(chatPrompts.confirm);
                });
            });
        });
});
