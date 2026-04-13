/* eslint-disable @typescript-eslint/no-explicit-any */
import Imap, { Box } from 'imap';
import { simpleParser, ParsedMail } from 'mailparser';
import { REGISTRATION_CONFIG } from '../data/registration.data';
import { COMMON_TIMEOUTS } from '../data/common.data';

const { forgotPassword } = REGISTRATION_CONFIG;

interface GmailCredentials {
    email: string;
    appPassword: string;
}

interface EmailContent {
    subject: string;
    body: string;
    toRecipients: string[];
    date: Date | null;
}

interface RegistrationEmailData {
    password: string | null;
    email: string | null;
    rawContent: string;
}

interface PasswordResetEmailData {
    password: string | null;
    loginUrl: string | null;
    userName: string | null;
    rawContent: string;
}

interface PasswordResetLinkEmailData {
    createPasswordUrl: string | null;
    rawContent: string;
}

interface PasswordChangeNotificationEmailData {
    userName: string | null;
    rawContent: string;
}

type EmailExtractor<T> = (email: EmailContent) => T | null;

export class GmailService {
    private credentials: GmailCredentials | null = null;

    private static readonly PASSWORD_PATTERNS = [
        /Your temporary password is:\s*([^\s\n<]+)/i,
        /temporary password is:\s*([^\s\n<]+)/i,
        /password is:\s*([^\s\n<]+)/i,
        /password:\s*([^\s\n<]+)/i,
    ];

    private static readonly EMAIL_SUBJECTS = {
        platformInvitation: forgotPassword.platformInvitationEmailSubject,
        passwordResetLink: forgotPassword.passwordResetEmailSubject,
        passwordChangeNotification: forgotPassword.passwordChangeNotificationEmailSubject,
    };

    async initialize(): Promise<void> {
        const { gmailCredentials } = REGISTRATION_CONFIG;

        if (!gmailCredentials?.email || !gmailCredentials?.appPassword) {
            throw new Error(
                'Gmail credentials not configured in data/registration.data.ts.\n' +
                'Please add gmailCredentials with email and appPassword.\n\n' +
                'To generate an App Password:\n' +
                '1. Go to https://myaccount.google.com/security\n' +
                '2. Enable 2-Step Verification if not already enabled\n' +
                '3. Go to App passwords and generate one for "Mail"'
            );
        }

        this.credentials = {
            email: gmailCredentials.email,
            appPassword: gmailCredentials.appPassword,
        };
    }

    private createImapConnection(): Imap {
        if (!this.credentials) {
            throw new Error('Credentials not initialized');
        }

        return new Imap({
            user: this.credentials.email,
            password: this.credentials.appPassword,
            host: 'imap.gmail.com',
            port: 993,
            tls: true,
            tlsOptions: { rejectUnauthorized: false },
            authTimeout: COMMON_TIMEOUTS.standard,
            connTimeout: COMMON_TIMEOUTS.standard,
        });
    }

    async waitForRegistrationEmail(
        recipientEmail: string,
        maxWaitTimeMs: number = COMMON_TIMEOUTS.long,
        pollIntervalMs: number = COMMON_TIMEOUTS.short
    ): Promise<RegistrationEmailData> {
        return this.waitForEmail(
            recipientEmail,
            GmailService.EMAIL_SUBJECTS.platformInvitation,
            (email) => this.extractRegistrationData(email),
            maxWaitTimeMs,
            pollIntervalMs
        );
    }

    async waitForPlatformInvitationEmail(
        recipientEmail: string,
        maxWaitTimeMs: number = COMMON_TIMEOUTS.long,
        pollIntervalMs: number = COMMON_TIMEOUTS.short
    ): Promise<PasswordResetEmailData> {
        return this.waitForEmail(
            recipientEmail,
            GmailService.EMAIL_SUBJECTS.platformInvitation,
            (email) => this.extractPasswordResetData(email),
            maxWaitTimeMs,
            pollIntervalMs
        );
    }

    async waitForPasswordResetLinkEmail(
        recipientEmail: string,
        maxWaitTimeMs: number = COMMON_TIMEOUTS.long,
        pollIntervalMs: number = COMMON_TIMEOUTS.short
    ): Promise<PasswordResetLinkEmailData> {
        return this.waitForEmail(
            recipientEmail,
            GmailService.EMAIL_SUBJECTS.passwordResetLink,
            (email) => this.extractPasswordResetLinkData(email),
            maxWaitTimeMs,
            pollIntervalMs
        );
    }

    async waitForPasswordChangeNotificationEmail(
        recipientEmail: string,
        maxWaitTimeMs: number = COMMON_TIMEOUTS.long,
        pollIntervalMs: number = COMMON_TIMEOUTS.short
    ): Promise<PasswordChangeNotificationEmailData> {
        return this.waitForEmail(
            recipientEmail,
            GmailService.EMAIL_SUBJECTS.passwordChangeNotification,
            (email) => this.extractPasswordChangeNotificationData(email),
            maxWaitTimeMs,
            pollIntervalMs
        );
    }

    private async waitForEmail<T>(
        recipientEmail: string,
        subject: string,
        extractor: EmailExtractor<T>,
        maxWaitTimeMs: number,
        pollIntervalMs: number
    ): Promise<T> {
        if (!this.credentials) {
            await this.initialize();
        }

        const startTime = Date.now();
        while (Date.now() - startTime < maxWaitTimeMs) {
            try {
                const emails = await this.searchEmailsBySubject(subject);

                const sortedEmails = emails.sort((a, b) => {
                    const dateA = a.date?.getTime() || 0;
                    const dateB = b.date?.getTime() || 0;
                    return dateB - dateA;
                });

                for (const email of sortedEmails) {
                    if (!this.isRecipientMatch(email, recipientEmail)) {
                        continue;
                    }

                    const extractedData = extractor(email);
                    if (extractedData) {
                        return extractedData;
                    }
                }
            } catch {
                // Continue polling on error
            }
            await this.sleep(pollIntervalMs);
        }

        throw new Error(`Email with subject "${subject}" not found for ${recipientEmail} within ${maxWaitTimeMs / 1000} seconds`);
    }

    private isRecipientMatch(email: EmailContent, recipientEmail: string): boolean {
        return email.toRecipients.some(to =>
            to.toLowerCase().includes(recipientEmail.toLowerCase()) ||
            recipientEmail.toLowerCase().includes(to.toLowerCase().replace(/\+[^@]+/, ''))
        );
    }

    private async searchEmailsBySubject(subject: string): Promise<EmailContent[]> {
        return new Promise((resolve, reject) => {
            const imap = this.createImapConnection();
            const emails: EmailContent[] = [];

            imap.once('ready', () => {
                imap.openBox('INBOX', true, (err: Error | null) => {
                    if (err) {
                        imap.end();
                        reject(err);
                        return;
                    }

                    const yesterday = new Date();
                    yesterday.setDate(yesterday.getDate() - 1);

                    const searchCriteria: any[] = [
                        ['SINCE', yesterday],
                        ['SUBJECT', subject],
                    ];

                    imap.search(searchCriteria, (searchErr: Error | null, results: number[]) => {
                        if (searchErr) {
                            imap.end();
                            reject(searchErr);
                            return;
                        }

                        if (!results || results.length === 0) {
                            imap.end();
                            resolve([]);
                            return;
                        }

                        const recentResults = results.slice(-20);
                        const fetch = imap.fetch(recentResults, {
                            bodies: '',
                            struct: true,
                        });

                        fetch.on('message', (msg: any) => {
                            msg.on('body', (stream: any) => {
                                simpleParser(stream, (parseErr: Error | null, parsed: ParsedMail) => {
                                    if (parseErr) {
                                        return;
                                    }
                                    emails.push(this.parseEmailContent(parsed));
                                });
                            });
                        });

                        fetch.once('error', (fetchErr: Error) => {
                            imap.end();
                            reject(fetchErr);
                        });

                        fetch.once('end', () => {
                            imap.end();
                            setTimeout(() => resolve(emails), 500);
                        });
                    });
                });
            });

            imap.once('error', (err: Error) => {
                reject(new Error(`IMAP connection error: ${err.message}`));
            });

            imap.connect();
        });
    }

    private parseEmailContent(parsed: ParsedMail): EmailContent {
        const toRecipients = Array.isArray(parsed.to)
            ? parsed.to.flatMap((addr: any) => addr.value?.map((v: any) => v.address || '') || [])
            : (parsed.to as any)?.value?.map((v: any) => v.address || '') || [];

        return {
            subject: parsed.subject || '',
            body: parsed.text || parsed.html || '',
            toRecipients,
            date: parsed.date || null,
        };
    }

    private extractFirstMatch(content: string, patterns: RegExp[]): string | null {
        for (const pattern of patterns) {
            const match = content.match(pattern);
            if (match?.[1]) {
                return match[1].trim();
            }
        }
        return null;
    }

    private extractPassword(content: string): string | null {
        return this.extractFirstMatch(content, GmailService.PASSWORD_PATTERNS);
    }

    private extractUserName(content: string): string | null {
        return this.extractFirstMatch(content, [/Hi\s+([^,\n]+),/i]);
    }

    private extractRegistrationData(email: EmailContent): RegistrationEmailData | null {
        const content = this.getTextContent(email.body);
        const password = this.extractPassword(content);

        if (!password) {
            return null;
        }

        return {
            password,
            email: email.toRecipients[0] || null,
            rawContent: content,
        };
    }

    private static readonly LOGIN_URL_PATTERNS = [
        /href="([^"]+)"[^>]*>\s*Log in to Symphona/i,
        /href="(https?:\/\/[^"]*app\.symphona\.ai[^"]*)"/i,
        /login here:\s*(https?:\/\/[^\s]+)/i,
        /Symphona here:\s*(https?:\/\/[^\s]+)/i,
    ];

    private extractPasswordResetData(email: EmailContent): PasswordResetEmailData | null {
        const content = this.getTextContent(email.body);
        const password = this.extractPassword(content);

        if (!password) {
            return null;
        }

        return {
            password,
            loginUrl: this.extractFirstMatch(email.body, GmailService.LOGIN_URL_PATTERNS),
            userName: this.extractUserName(content),
            rawContent: content,
        };
    }

    private static readonly CREATE_PASSWORD_URL_PATTERNS = [
        /href="(https?:\/\/[^"]*create-new-password[^"]*)"/i,
        /href="([^"]+)"[^>]*>Create New Password/i,
        /(https?:\/\/[^\s"<>]*create-new-password[^\s"<>]*)/i,
    ];

    private extractPasswordResetLinkData(email: EmailContent): PasswordResetLinkEmailData | null {
        const content = this.getTextContent(email.body);
        let createPasswordUrl = this.extractFirstMatch(email.body, GmailService.CREATE_PASSWORD_URL_PATTERNS);

        if (!createPasswordUrl) {
            return null;
        }

        createPasswordUrl = this.decodeHtmlEntities(createPasswordUrl);

        return {
            createPasswordUrl,
            rawContent: content,
        };
    }

    private decodeHtmlEntities(text: string): string {
        return text
            .replace(/&amp;/g, '&')
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .replace(/&quot;/g, '"')
            .replace(/&#39;/g, "'")
            .replace(/&nbsp;/g, ' ');
    }

    private extractPasswordChangeNotificationData(email: EmailContent): PasswordChangeNotificationEmailData | null {
        const content = this.getTextContent(email.body);
        const expectedText = forgotPassword.passwordChangeNotificationValidation.successMessage;
        if (!content.includes(expectedText)) {
            return null;
        }

        return {
            userName: this.extractUserName(content),
            rawContent: content,
        };
    }

    private getTextContent(body: string): string {
        if (body.includes('<')) {
            return this.stripHtml(body);
        }
        return body;
    }

    private stripHtml(html: string): string {
        return html
            .replace(/<br\s*\/?>/gi, '\n')
            .replace(/<\/p>/gi, '\n\n')
            .replace(/<\/div>/gi, '\n')
            .replace(/<[^>]+>/g, '')
            .replace(/&nbsp;/g, ' ')
            .replace(/&amp;/g, '&')
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .replace(/&quot;/g, '"')
            .replace(/&#39;/g, "'")
            .replace(/\s+/g, ' ')
            .trim();
    }

    private sleep(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    async deleteEmailsBySubject(subject: string): Promise<number> {
        if (!this.credentials) {
            await this.initialize();
        }

        return new Promise((resolve, reject) => {
            const imap = this.createImapConnection();

            imap.once('ready', () => {
                imap.openBox('INBOX', false, (err: Error | null) => {
                    if (err) {
                        imap.end();
                        reject(err);
                        return;
                    }

                    const searchCriteria: any[] = [['SUBJECT', subject]];

                    imap.search(searchCriteria, (searchErr: Error | null, results: number[]) => {
                        if (searchErr) {
                            imap.end();
                            reject(searchErr);
                            return;
                        }

                        if (!results || results.length === 0) {
                            imap.end();
                            resolve(0);
                            return;
                        }

                        imap.addFlags(results, ['\\Deleted'], (flagErr: Error | null) => {
                            if (flagErr) {
                                imap.end();
                                reject(flagErr);
                                return;
                            }

                            imap.expunge((expungeErr: Error | null) => {
                                imap.end();
                                if (expungeErr) {
                                    reject(expungeErr);
                                    return;
                                }
                                resolve(results.length);
                            });
                        });
                    });
                });
            });

            imap.once('error', (err: Error) => {
                reject(new Error(`IMAP connection error: ${err.message}`));
            });

            imap.connect();
        });
    }

    async deleteAllTestEmails(): Promise<number> {
        const subjects = [
            GmailService.EMAIL_SUBJECTS.platformInvitation,
            GmailService.EMAIL_SUBJECTS.passwordResetLink,
            GmailService.EMAIL_SUBJECTS.passwordChangeNotification,
        ];

        let totalDeleted = 0;
        for (const subject of subjects) {
            if (subject) {
                const deleted = await this.deleteEmailsBySubject(subject);
                totalDeleted += deleted;
            }
        }

        return totalDeleted;
    }

    async deleteAllEmails(): Promise<number> {
        if (!this.credentials) {
            await this.initialize();
        }

        return new Promise((resolve, reject) => {
            const imap = this.createImapConnection();

            imap.once('ready', () => {
                imap.openBox('INBOX', false, (err: Error | null, box: Box) => {
                    if (err) {
                        imap.end();
                        reject(err);
                        return;
                    }

                    if (box.messages.total === 0) {
                        imap.end();
                        resolve(0);
                        return;
                    }

                    // Search for all emails
                    imap.search(['ALL'], (searchErr: Error | null, results: number[]) => {
                        if (searchErr) {
                            imap.end();
                            reject(searchErr);
                            return;
                        }

                        if (!results || results.length === 0) {
                            imap.end();
                            resolve(0);
                            return;
                        }

                        imap.addFlags(results, ['\\Deleted'], (flagErr: Error | null) => {
                            if (flagErr) {
                                imap.end();
                                reject(flagErr);
                                return;
                            }

                            imap.expunge((expungeErr: Error | null) => {
                                imap.end();
                                if (expungeErr) {
                                    reject(expungeErr);
                                    return;
                                }
                                resolve(results.length);
                            });
                        });
                    });
                });
            });

            imap.once('error', (err: Error) => {
                reject(new Error(`IMAP connection error: ${err.message}`));
            });

            imap.connect();
        });
    }
}
