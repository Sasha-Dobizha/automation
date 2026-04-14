
import { test as base } from '@playwright/test'
import { LoginPage } from "../pages/login.page";
import { Utils } from "../utils/utils";
import { RegistrationPage } from '../pages/registration.page';
import { GeneralSettingsPage } from '../pages/settings/general.page';
import { AccessManagementPage } from '../pages/settings/accessManagement.page';
import { ProcessManagerPage } from '../pages/flow/processManager.page';
import { ServiceTicketPage } from '../pages/serve/serviceTicket.page';
import { KnowledgeBasePage } from '../pages/settings/knowledgeBase.page';
import { AgentManagerPage } from '../pages/converse/agentManager.page';
import { AgentTesterPage } from '../pages/converse/agentTester.page';
import { CpqPage } from '../pages/cpq/cpq.page';

type BaseFixture = {
    loginPage: LoginPage
    utils: Utils
    registrationPage: RegistrationPage
    generalSettingsPage: GeneralSettingsPage
    accessManagementPage: AccessManagementPage
    processManagerPage: ProcessManagerPage
    serviceTicketPage: ServiceTicketPage
    knowledgeBasePage: KnowledgeBasePage
    agentManagerPage: AgentManagerPage
    agentTesterPage: AgentTesterPage
    cpqPage: CpqPage
}


export const test = base.extend<BaseFixture>({
    page: async ({ page }, use) => {
        await use(page);
    },

    loginPage: async ({ page }, use) => {
        const loginPage = new LoginPage(page);
        await use(loginPage);
    },

    utils: async ({ page }, use) => {
        const utils = new Utils(page);
        await use(utils);
    },

    registrationPage: async ({ page }, use) => {
        const registrationPage = new RegistrationPage(page);
        await use(registrationPage);
    },

    generalSettingsPage: async ({ page }, use) => {
        const generalSettingsPage = new GeneralSettingsPage(page);
        await use(generalSettingsPage);
    },

    accessManagementPage: async ({ page }, use) => {
        const accessManagementPage = new AccessManagementPage(page);
        await use(accessManagementPage);
    },

    processManagerPage: async ({ page }, use) => {
        const processManagerPage = new ProcessManagerPage(page);
        await use(processManagerPage);
    },

    serviceTicketPage: async ({ page }, use) => {
        const serviceTicketPage = new ServiceTicketPage(page);
        await use(serviceTicketPage);
    },

    knowledgeBasePage: async ({ page }, use) => {
        const knowledgeBasePage = new KnowledgeBasePage(page);
        await use(knowledgeBasePage);
    },

    agentManagerPage: async ({ page }, use) => {
        const agentManagerPage = new AgentManagerPage(page);
        await use(agentManagerPage);
    },

    agentTesterPage: async ({ page }, use) => {
        const agentTesterPage = new AgentTesterPage(page);
        await use(agentTesterPage);
    },

    cpqPage: async ({ page }, use) => {
        const cpqPage = new CpqPage(page);
        await use(cpqPage);
    },
})
