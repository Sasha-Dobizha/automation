export const PROCESS_MANAGER_CONFIG = {
    urls: {
        processManager: '/flow/manager',
        editorPattern: /\/flow\/manager\/editor\//,
        trigger: '/flow/trigger',
        processHistory: '/flow/history',
    },

    selectors: {
        newProcessButton: 'New Process',
        createButton: 'Create',
        processNameInput: 'displayName',
        processDescriptionTextarea: 'description',
        searchPlaceholder: 'Search',
        stepLibraryTab: 'Step Library',
        stepSearchPlaceholder: 'Search for Steps...',
        inputConfigurationLabel: 'Input Configuration',
        deployButton: 'Deploy',
        // Trigger Process selectors
        submitExecutionButton: 'Submit Execution',
        viewExecutionButton: 'View Execution',
        leavePageButton: 'Leave Page',
        processHistorySearchPlaceholder: 'Search Process Names and IDs...',
        // Initial Parameters selectors
        initialParameterName: 'first_name',
        initialParametersTab: 'Initial Parameters',
        addNewParameterButton: 'Add a New Parameter',
        parameterNameInputName: 'paramName',
        parameterTypePlaceholder: 'Select Workflow Parameter',
        confirmParameterButton: 'Confirm',
        // Trigger Process - Define Execution selectors
        defineExecutionButton: 'Define Execution',
        uploadProcessButton: 'Upload Process',
        // Trigger Process Step Config selectors
        processPlaceholder: 'Process',
        // Delete Process selectors
        deleteButton: 'Delete',
        deleteConfirmationText: 'delete process',
        continueButton: 'Continue',
        noProcessesFound: 'No Processes Found',
        // Process Settings selectors
        editProcessDetails: 'Edit Process Details',
        saveDetailsButton: 'Save',
    },

    messages: {
        processCreated: 'The Process has been created successfully',
        processDeployed: 'has successfully been deployed',
        executionSubmittedToast: 'Process execution request has been initiated',
        executionSubmittedDialog: 'Execution Submitted Successfully',
        statusSuccess: 'Success',
        processDeleted: 'The Process has been deleted successfully',
    },

    breadcrumbs: {
        processManager: 'Process Manager',
    },
} as const;
