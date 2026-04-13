import { test } from '../fixtures/base.fixture';
import { AUTH_PATHS } from '../config/auth.config';
import { newKnowledgeBase, type KnowledgeBaseData } from '../data/knowledgeBase/knowledgeBase.factory';
import { KnowledgeBasePage } from '../pages/settings/knowledgeBase.page';

test.describe('Settings - AI Knowledge Base', () => {
    test.use({ storageState: AUTH_PATHS.adminState });

    function defineKBTests(
        sourceType: string,
        createFn: (kb: KnowledgeBasePage, kbName: string, ksName: string) => Promise<void>,
    ) {
        test.describe.serial(`KB with ${sourceType} Source`, () => {
            const data: KnowledgeBaseData = newKnowledgeBase.build({}, { sourceType });

            test(`Create Knowledge Base & ${sourceType} Knowledge Source`, async ({
                knowledgeBasePage,
            }) => {
                await createFn(knowledgeBasePage, data.kbName, data.ksName);
            });

            test('Verify KB is visible in list', async ({ knowledgeBasePage }) => {
                await knowledgeBasePage.verifyKBVisibleInList(data.kbName);
            });

            test('Verify KB status is Ready (Up-to-Date)', async ({ knowledgeBasePage }) => {
                await knowledgeBasePage.verifyKBStatus(data.kbName);
            });

            test('Delete Knowledge Base', async ({ knowledgeBasePage }) => {
                await knowledgeBasePage.deleteKB(data.kbName);
            });

            test('Verify KB is removed from list after deletion', async ({
                knowledgeBasePage,
            }) => {
                await knowledgeBasePage.verifyKBNotInList(data.kbName);
            });
        });
    }

    defineKBTests('Text', (kb, kbName, ksName) => kb.createKBWithTextSource(kbName, ksName));
    defineKBTests('File', (kb, kbName) => kb.createKBWithFileSource(kbName));
    defineKBTests('API', (kb, kbName, ksName) => kb.createKBWithApiSource(kbName, ksName));
    defineKBTests('Website', (kb, kbName, ksName) => kb.createKBWithWebsiteSource(kbName, ksName));
});
