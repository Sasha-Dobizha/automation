import { COMMON_TIMEOUTS, COMMON_URLS } from './common.data';

const TEST_EMAIL = 'symphonatest@gmail.com';
const ADMIN_EMAIL = process.env.ADMIN_COMPANY_USERNAME || '';
const ADMIN_PASSWORD = process.env.ADMIN_COMPANY_PASSWORD || '';
const GOOGLE_TEST_USER_EMAIL = process.env.GOOGLE_TEST_USER_EMAIL || '';
const RESET_TEST_PASSWORD = process.env.RESET_PASSWORD_TEST_PASSWORD || '';

export const REGISTRATION_CONFIG = {
    urls: {
        registration: '/register-for-qa',
        baseUrl: COMMON_URLS.baseUrl,
    },
    adminCredentials: {
        email: ADMIN_EMAIL,
        password: ADMIN_PASSWORD,
    },

    // Credentials for forgot password test: always uses the Gmail mailbox we can read from
    forgotPasswordCredentials: {
        email: GOOGLE_TEST_USER_EMAIL,
        resetPassword: RESET_TEST_PASSWORD,
    },

    timeouts: COMMON_TIMEOUTS,

    // Gmail IMAP credentials for email verification
    gmailCredentials: {
        email: TEST_EMAIL,
        appPassword: 'czgq kecw cduz zdzh',
    },

    testData: {
        gmailVerificationAccount: TEST_EMAIL,
        firstNamePrefix: 'Name',
        lastNamePrefix: 'Surname',
        companyPrefix: 'TestCompany',
        phoneCountryCode: '+1',
    },

    pageText: {
        personalDetails: 'Personal Details',
        mandatoryFields: '* indicates mandatory fields',
        congratulations: 'Congratulations!',
        successMessage: 'You Have Successfully Registered For Symphona',
        emailResent: 'Email resent successfully',
        createAccount: 'Create Account',
        returnToLogin: 'Return to Login Page',
        resendEmail: /click here to resend the email/i,
    },

    loginPage: {
        emailPlaceholder: 'Enter your email...',
        passwordPlaceholder: 'Enter your password...',
        loginButton: 'Log In',
        dashboardSelector: 'a[name="My Summary"]',
    },

    loginErrors: {
        loginFailedHeader: 'Login Failed',
        invalidCredentialsMessage: 'Invalid username or password',
    },

    invalidCredentials: {
        validEmail: ADMIN_EMAIL,
        wrongPassword: 'WrongPassword123!',
    },

    forgotPassword: {
        forgotPasswordButton: 'Forgot Password?',
        resetPageTitle: 'Reset Your Password',
        requestResetButton: 'Request Reset',
        returnToLoginButton: 'Return to Log In',
        invalidEmailError: 'Invalid email address',
        successTitle: 'Success',
        successMessage: 'Your reset email request has been received. If an account with that email is found, further information will be sent.',
        fakeEmail: 'invalid-email-test',
        unregisteredEmail: 'unregistered-user-test@nonexistent-domain.com',
        // Email subjects
        platformInvitationEmailSubject: 'Symphona Platform Invitation',
        passwordResetEmailSubject: 'Symphona Password Reset Request',
        passwordChangeNotificationEmailSubject: 'Symphona Password Change Notification',
        // Platform Invitation email content (has temp password + login URL)
        platformInvitationValidation: {
            welcomeText: 'Welcome to Symphona',
            platformDescription: 'AI business efficiency platform',
        },
        // Password Reset email content (has create new password link)
        passwordResetValidation: {
            requestedResetText: 'You requested to reset your Symphona password',
            createNewPasswordLinkText: 'Create New Password',
        },
        // Create New Password page
        createNewPassword: {
            newPasswordLabel: 'New Password',
            changePasswordButton: 'Change Password',
            passwordResetSuccessTitle: 'Your Password Has Been Reset',
            goToLoginButton: 'Go to Log In',
        },
        // Password validation
        passwordValidation: {
            invalidPasswords: {
                tooShort: 'Ab1!',
                missingSpecialChar: 'Password123',
                missingNumber: 'Password!abc',
                missingUppercase: 'password123!',
            },
            validPassword: ADMIN_PASSWORD,
            errorMessages: {
                minLength: 'at least 8 characters',
                specialChar: 'special character',
                number: 'number',
                uppercase: 'uppercase',
            },
        },
        // Password Change Notification email content
        passwordChangeNotificationValidation: {
            successMessage: 'Your Symphona password has been successfully changed',
            contactSupportMessage: 'Please contact support and/or your organization\'s administrator if you did not make this change',
        },
    },

    // Assertion messages for test readability
    assertions: {
        registration: {
            passwordFoundInEmail: 'Password should be found in registration email',
        },
        platformInvitation: {
            emailReceived: 'Platform invitation email content should not be empty',
            temporaryPasswordPresent: 'Temporary password should be present in email',
            temporaryPasswordNotEmpty: 'Temporary password should not be empty',
            loginUrlPresent: 'Login URL should be present in email',
            loginUrlMatchesBaseUrl: 'Login URL should start with BASE_URL',
            userNamePresent: 'User name should be present in email greeting',
        },
        passwordResetLink: {
            emailReceived: 'Password reset email content should not be empty',
            createPasswordLinkPresent: 'Create New Password link should be present in email',
        },
        passwordChangeNotification: {
            emailReceived: 'Password change notification email should be received',
            successMessagePresent: 'Password change success message should be present in email',
            userNamePresent: 'User name should be present in email greeting',
        },
    },
} as const;

export type RegistrationConfig = typeof REGISTRATION_CONFIG;
