import { test } from '../../fixtures/base.fixture';
import { expect } from '@playwright/test';
import { AUTH_PATHS } from '../../config/auth.config';
import { newInviteUser, type InviteUserData } from '../../factories/accessManagement.factory';
import { newUserGroup, type UserGroupData } from '../../factories/userGroups.factory';

test.describe('Settings - Access Management', () => {
    test.use({ storageState: AUTH_PATHS.adminState });

    test('Invite new user and verify in users list', async ({ accessManagementPage }) => {
        const userData: InviteUserData = newInviteUser.build();

        await test.step('Navigate to Access Management page', async () => {
            await accessManagementPage.navigateToAccessManagement();
        });

        await test.step('Click Add User button', async () => {
            await accessManagementPage.clickAddUser();
        });

        await test.step('Enter valid user details', async () => {
            await accessManagementPage.fillUserDetails(userData);
        });

        await test.step('Click Invite User button', async () => {
            await accessManagementPage.clickInviteUser();
        });

        await test.step('Verify newly invited user appears in users list', async () => {
            await accessManagementPage.searchForUser(userData.firstName);
            await accessManagementPage.verifyUserInTable(userData.firstName);
        });

        await test.step('Select the invited user from the list', async () => {
            await accessManagementPage.selectUserFromTable(userData.firstName);
            await accessManagementPage.verifyUserDetailsPage();
        });
    });
});

test.describe.serial('Settings - Access Management - User Groups', () => {
    test.use({ storageState: AUTH_PATHS.adminState });

    const userGroupData: UserGroupData = newUserGroup.build();
    const groupName = userGroupData.name;
    const groupDescription = userGroupData.description;
    const targetUser = 'Automation';
    const targetUserFullName = 'Automation User';

    test('Create a new user group', async ({ accessManagementPage }) => {
        await test.step('Navigate to Access Management page', async () => {
            await accessManagementPage.navigateToAccessManagement();
        });

        await test.step('Click on User Groups tab', async () => {
            await accessManagementPage.clickUserGroupsTab();
        });

        await test.step('Click "+ Create User Group" button', async () => {
            await accessManagementPage.clickCreateUserGroup();
        });

        await test.step('Enter valid Name and Description', async () => {
            await accessManagementPage.fillUserGroupDetails(groupName, groupDescription);
        });

        await test.step('Click Create button', async () => {
            await accessManagementPage.clickCreateButton();
        });

        await test.step('Verify user group created toast message', async () => {
            await accessManagementPage.verifyUserGroupCreatedToast(groupName);
        });
    });

    test('Assign permissions to user group', async ({ accessManagementPage }) => {
        await test.step('Navigate to User Groups tab', async () => {
            await accessManagementPage.navigateToUserGroupsTab();
        });

        await test.step('Search for the user group', async () => {
            await accessManagementPage.searchForUserGroup(groupName);
        });

        await test.step('Select the user group from the list', async () => {
            await accessManagementPage.selectUserGroupFromTable(groupName);
        });

        await test.step('Click "Manage Permissions" in Permission Summary section', async () => {
            await accessManagementPage.clickManagePermissions();
        });

        await test.step('Open Select Permissions dropdown', async () => {
            await accessManagementPage.openSelectPermissionsDropdown();
        });

        await test.step('Select all permissions by clicking "Select All"', async () => {
            await accessManagementPage.selectAllPermissions();
        });

        await test.step('Click Add button to save permissions', async () => {
            await accessManagementPage.clickAddButton();
        });

        await test.step('Verify permissions added toast message', async () => {
            await accessManagementPage.verifyPermissionsAddedToast();
        });
    });

    test('Assign user group to a user', async ({ accessManagementPage }) => {
        await test.step('Navigate to Access Management page', async () => {
            await accessManagementPage.navigateToAccessManagement();
        });

        await test.step('Search for Automation user', async () => {
            await accessManagementPage.searchForUser(targetUser);
        });

        await test.step('Select Automation User from the list', async () => {
            await accessManagementPage.selectUserFromTable(targetUserFullName);
        });

        await test.step('Click "Manage User Groups"', async () => {
            await accessManagementPage.clickManageUserGroups();
        });

        await test.step('Add the created user group to the user', async () => {
            await accessManagementPage.addUserGroupToUser(groupName);
        });

        await test.step('Click Add button to assign user group', async () => {
            await accessManagementPage.clickAddUserGroupsButton();
        });

        await test.step('Verify user group added successfully toast', async () => {
            await accessManagementPage.verifyUserGroupsAddedToast();
        });

        await test.step('Verify user group appears in Associated User Groups table with today\'s date', async () => {
            await accessManagementPage.verifyUserGroupInAssociatedTableWithTodayDate(groupName);
        });
    });

    test('Delete user group', async ({ accessManagementPage }) => {
        await test.step('Navigate to User Groups tab', async () => {
            await accessManagementPage.navigateToUserGroupsTab();
        });

        await test.step('Search for the created user group', async () => {
            await accessManagementPage.searchForUserGroup(groupName);
        });

        await test.step('Click Delete button on the user group row', async () => {
            await accessManagementPage.deleteUserGroupFromTable(groupName);
        });

        await test.step('Confirm deletion in the confirmation dialog', async () => {
            await accessManagementPage.confirmDeletion();
        });

        await test.step('Verify user group deleted toast message', async () => {
            await accessManagementPage.verifyUserGroupDeletedToast(groupName);
        });
    });

    test('Verify user group removed from associated user', async ({ accessManagementPage }) => {
        await test.step('Navigate to Access Management page', async () => {
            await accessManagementPage.navigateToAccessManagement();
        });

        await test.step('Search for Automation user', async () => {
            await accessManagementPage.searchForUser(targetUser);
        });

        await test.step('Select Automation User from the list', async () => {
            await accessManagementPage.selectUserFromTable(targetUserFullName);
        });

        await test.step('Verify user group is no longer in Associated User Groups', async () => {
            await accessManagementPage.verifyUserGroupNotInAssociatedTable(groupName);
        });
    });
});
