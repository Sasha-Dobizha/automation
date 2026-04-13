import { COMMON_TIMEOUTS } from '../common.data';

export const ACCESS_MANAGEMENT_CONFIG = {
    urls: {
        accessManagement: '/settings/access-management',
        userGroupsTab: '/settings/access-management?tab=userGroups',
        userDetailsPattern: /\/settings\/access-management\/users\/.*/,
        userGroupDetailsPattern: /\/settings\/access-management\/user-groups\//,
    },

    timeouts: COMMON_TIMEOUTS,

    selectors: {
        // Users tab
        addUserButton: 'Add User',
        inviteUserButton: 'Invite User',
        generatePasswordAriaLabel: 'Generate Unique Password',
        searchUsersPlaceholder: 'Search Users...',
        usersTable: '.MuiTableContainer-root table',

        // User Groups tab
        userGroupsTab: 'User Groups',
        createUserGroupButton: 'Create User Group',
        createButton: 'Create',
        addButton: 'Add',
        deleteButton: 'Delete',
        managePermissionsButton: 'Manage Permissions',
        manageUserGroupsButton: 'Manage User Groups',
        selectAllOption: 'Select All',
        searchUserGroupsPlaceholder: 'Search User Groups...',
        addUserGroupsPlaceholder: 'Add User Groups...',
        assignUserGroupsLabel: 'Assigned users to, or remove them from, this user groups',
        permissionSummarySection: 'Permission Summary',
    },

    formFields: {
        firstName: 'firstName',
        lastName: 'lastName',
        email: 'email',
        password: 'password',
        timezone: 'timezone',

        // User Group form
        userGroupName: 'name',
        userGroupDescription: 'description',
    },

    timezones: {
        vancouver: 'Vancouver',
    },

    messages: {
        successTitle: 'Success',
        userInvitedSuccess: 'User has been invited successfully',
        userGroupCreated: (name: string) => `User group "${name}" was successfully created!`,
        permissionsAdded: 'Permissions added successfully to userGroup',
        userGroupsAddedToUser: 'User groups added successfully',
        userGroupDeleted: (_name: string) => `User group "undefined" was successfully removed!`,
        // userGroupDeleted: (name: string) => `User group "${name}" was successfully removed!`,
        confirmDeletion: 'Are You Sure?',
    },
} as const;

export type AccessManagementConfig = typeof ACCESS_MANAGEMENT_CONFIG;

export function getTodayFormatted(): string {
    return new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: '2-digit',
        timeZone: 'UTC',
    });
}
