import { expect, type Page, type Locator } from '@playwright/test';
import { ACCESS_MANAGEMENT_CONFIG, getTodayFormatted } from '../../data/settings/accessManagement.data';
import { type InviteUserData } from '../../factories/accessManagement.factory';

const { urls, timeouts, selectors, formFields, timezones, messages } = ACCESS_MANAGEMENT_CONFIG;

export class AccessManagementPage {
    // --- Users tab locators ---
    readonly addUserButton: Locator;
    readonly inviteUserButton: Locator;
    readonly firstNameInput: Locator;
    readonly lastNameInput: Locator;
    readonly emailInput: Locator;
    readonly timezoneInput: Locator;
    readonly generatePasswordButton: Locator;
    readonly searchUsersInput: Locator;
    readonly usersTable: Locator;
    readonly userTableRows: Locator;

    // --- User Groups tab locators ---
    readonly userGroupsTab: Locator;
    readonly createUserGroupButton: Locator;
    readonly userGroupNameInput: Locator;
    readonly userGroupDescriptionTextarea: Locator;
    readonly searchUserGroupsInput: Locator;
    readonly managePermissionsButton: Locator;
    readonly manageUserGroupsButton: Locator;
    readonly associatedUserGroupsTable: Locator;
    // TODO: Replace fragile generated CSS class with a stable selector (data-testid or role)
    readonly dropdownIndicator: Locator;
    readonly addUserGroupsInput: Locator;
    readonly userGroupDropdownOption: Locator;
    readonly addUserGroupsButton: Locator;
    readonly addButton: Locator;
    readonly selectAllOption: Locator;

    // --- Dialog locators ---
    readonly dialog: Locator;
    readonly dialogCreateButton: Locator;
    readonly dialogDeleteButton: Locator;

    private readonly page: Page;

    constructor(page: Page) {
        this.page = page;
        // Users tab
        this.addUserButton = page.getByRole('button', { name: selectors.addUserButton });
        this.inviteUserButton = page.getByRole('button', { name: selectors.inviteUserButton });
        this.firstNameInput = page.locator(`input[name="${formFields.firstName}"]`);
        this.lastNameInput = page.locator(`input[name="${formFields.lastName}"]`);
        this.emailInput = page.locator(`input[name="${formFields.email}"]`);
        this.timezoneInput = page
            .locator(`input[name="${formFields.timezone}"]`)
            .locator('..')
            .locator('input[role="combobox"]');
        this.generatePasswordButton = page.locator(
            `span[aria-label="${selectors.generatePasswordAriaLabel}"]`,
        );
        this.searchUsersInput = page.locator(
            `input[placeholder="${selectors.searchUsersPlaceholder}"]`,
        );
        this.usersTable = page.locator(selectors.usersTable);
        this.userTableRows = this.usersTable.locator('tbody tr');

        // User Groups tab
        this.userGroupsTab = page.getByRole('tab', { name: selectors.userGroupsTab });
        this.createUserGroupButton = page.getByRole('button', {
            name: selectors.createUserGroupButton,
        });
        this.userGroupNameInput = page.locator(`input[name="${formFields.userGroupName}"]`);
        this.userGroupDescriptionTextarea = page.locator(
            `textarea[name="${formFields.userGroupDescription}"]`,
        );
        this.searchUserGroupsInput = page.locator(
            `input[placeholder="${selectors.searchUserGroupsPlaceholder}"]`,
        );
        this.managePermissionsButton = page.getByRole('button', {
            name: selectors.managePermissionsButton,
        });
        this.manageUserGroupsButton = page.getByRole('button', {
            name: selectors.manageUserGroupsButton,
        });
        this.associatedUserGroupsTable = page.locator('table').filter({
            has: page.locator('th', { hasText: 'Date Created' }),
        });
        this.dropdownIndicator = page.locator('.css-1xc3v61-indicatorContainer').first();
        this.addUserGroupsInput = page.locator('input[aria-autocomplete="list"]').last();
        this.userGroupDropdownOption = page.locator('[role="option"]');
        this.addUserGroupsButton = page
            .getByText(selectors.assignUserGroupsLabel, { exact: true })
            .locator('..')
            .getByRole('button', { name: selectors.addButton, exact: true });
        this.addButton = page.getByRole('button', { name: selectors.addButton, exact: true });
        this.selectAllOption = page.getByText(selectors.selectAllOption, { exact: true });

        // Dialog
        this.dialog = page.getByRole('dialog');
        this.dialogCreateButton = this.dialog.getByRole('button', {
            name: selectors.createButton,
        });
        this.dialogDeleteButton = this.dialog.getByRole('button', {
            name: selectors.deleteButton,
        });
    }

    // =====================
    // Shared helpers
    // =====================

    private getTableRow(name: string): Locator {
        return this.userTableRows.filter({ hasText: name });
    }

    private getTableRowLink(name: string): Locator {
        return this.getTableRow(name).locator('a').first();
    }

    private getAssociatedUserGroupRow(groupName: string): Locator {
        return this.associatedUserGroupsTable.locator('tbody tr').filter({ hasText: groupName });
    }

    // =====================
    // Navigation
    // =====================

    async navigateToAccessManagement(): Promise<void> {
        await this.page.goto(urls.accessManagement);
        await expect(this.addUserButton).toBeVisible({ timeout: timeouts.standard });
    }

    async navigateToUserGroupsTab(): Promise<void> {
        await this.page.goto(urls.userGroupsTab);
        await expect(this.createUserGroupButton).toBeVisible({ timeout: timeouts.standard });
    }

    async clickUserGroupsTab(): Promise<void> {
        await this.userGroupsTab.click();
        await expect(this.createUserGroupButton).toBeVisible({ timeout: timeouts.standard });
    }

    // =====================
    // Users tab – Invite User
    // =====================

    async clickAddUser(): Promise<void> {
        await this.addUserButton.click();
        await expect(this.firstNameInput).toBeVisible({ timeout: timeouts.short });
    }

    private async selectTimezone(timezone: string = timezones.vancouver): Promise<void> {
        await this.timezoneInput.click();
        await this.timezoneInput.fill(timezone);
        await this.page.keyboard.press('Enter');
    }

    private async generatePassword(): Promise<void> {
        await this.generatePasswordButton.click();
        await expect(
            this.page.locator(`input[name="${formFields.password}"]`),
        ).not.toHaveValue('', { timeout: timeouts.short });
    }

    async fillUserDetails(userData: InviteUserData): Promise<void> {
        await this.firstNameInput.fill(userData.firstName);
        await this.lastNameInput.fill(userData.lastName);
        await this.selectTimezone(userData.timezone);
        await this.emailInput.fill(userData.email);
        await this.generatePassword();
    }

    async clickInviteUser(): Promise<void> {
        await this.inviteUserButton.click();
    }

    // =====================
    // Users tab – Search & Select
    // =====================

    async searchForUser(searchTerm: string): Promise<void> {
        await this.searchUsersInput.fill(searchTerm);
    }

    async verifyUserInTable(firstName: string): Promise<void> {
        await expect(this.getTableRow(firstName)).toBeVisible({ timeout: timeouts.short });
    }

    async selectUserFromTable(firstName: string): Promise<void> {
        await this.getTableRowLink(firstName).click();
    }

    async verifyUserDetailsPage(): Promise<void> {
        await expect(this.page).toHaveURL(urls.userDetailsPattern, { timeout: timeouts.short });
    }

    // =====================
    // User Groups tab – CRUD
    // =====================

    async clickCreateUserGroup(): Promise<void> {
        await this.createUserGroupButton.click();
        await expect(this.userGroupNameInput).toBeVisible({ timeout: timeouts.short });
    }

    async fillUserGroupDetails(name: string, description: string): Promise<void> {
        await this.userGroupNameInput.fill(name);
        await this.userGroupDescriptionTextarea.fill(description);
    }

    async clickCreateButton(): Promise<void> {
        await this.dialogCreateButton.click();
    }

    async verifyUserGroupCreatedToast(name: string): Promise<void> {
        await expect(this.page.getByText(messages.userGroupCreated(name))).toBeVisible({
            timeout: timeouts.short,
        });
    }

    async searchForUserGroup(searchTerm: string): Promise<void> {
        await this.searchUserGroupsInput.fill(searchTerm);
    }

    async selectUserGroupFromTable(name: string): Promise<void> {
        await this.getTableRowLink(name).click();
        await expect(this.page).toHaveURL(urls.userGroupDetailsPattern, {
            timeout: timeouts.short,
        });
    }

    // =====================
    // User Group – Permissions
    // =====================

    async clickManagePermissions(): Promise<void> {
        await this.managePermissionsButton.click();
        await expect(this.dropdownIndicator).toBeVisible({ timeout: timeouts.short });
    }

    async openSelectPermissionsDropdown(): Promise<void> {
        await this.dropdownIndicator.click();
    }

    async selectAllPermissions(): Promise<void> {
        await this.selectAllOption.click();
    }

    async clickAddButton(): Promise<void> {
        await this.addButton.click();
    }

    async verifyPermissionsAddedToast(): Promise<void> {
        await expect(this.page.getByText(messages.permissionsAdded)).toBeVisible({
            timeout: timeouts.short,
        });
    }

    // =====================
    // User – Manage User Groups
    // =====================

    async clickManageUserGroups(): Promise<void> {
        await this.manageUserGroupsButton.click();
        await expect(this.addUserGroupsInput).toBeVisible({ timeout: timeouts.short });
    }

    async addUserGroupToUser(groupName: string): Promise<void> {
        await this.addUserGroupsInput.click();
        await this.addUserGroupsInput.pressSequentially(groupName, { delay: 50 });
        const option = this.userGroupDropdownOption.filter({ hasText: groupName });
        await option.waitFor({ timeout: timeouts.short });
        await option.click();
    }

    async clickAddUserGroupsButton(): Promise<void> {
        await this.addUserGroupsButton.click();
    }

    async verifyUserGroupsAddedToast(): Promise<void> {
        await expect(this.page.getByText(messages.userGroupsAddedToUser)).toBeVisible({
            timeout: timeouts.short,
        });
    }

    async verifyUserGroupInAssociatedTableWithTodayDate(groupName: string): Promise<void> {
        const row = this.getAssociatedUserGroupRow(groupName);
        await expect(row).toBeVisible({ timeout: timeouts.short });
        await expect(row).toContainText(getTodayFormatted());
    }

    async verifyUserGroupNotInAssociatedTable(groupName: string): Promise<void> {
        await expect(this.getAssociatedUserGroupRow(groupName)).toBeHidden({
            timeout: timeouts.short,
        });
    }

    // =====================
    // User Group – Deletion
    // =====================

    async deleteUserGroupFromTable(name: string): Promise<void> {
        // TODO: Replace fragile CSS class selector 'span.css-1160s13' with a stable locator
        await this.getTableRow(name).locator('span.css-1160s13').click();
    }

    async confirmDeletion(): Promise<void> {
        await expect(this.dialog.getByText(messages.confirmDeletion)).toBeVisible({
            timeout: timeouts.short,
        });
        await this.dialogDeleteButton.click();
    }

    async verifyUserGroupDeletedToast(name: string): Promise<void> {
        await expect(this.page.getByText(messages.userGroupDeleted(name))).toBeVisible({
            timeout: timeouts.short,
        });
    }
}
