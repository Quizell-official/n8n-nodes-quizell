"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.QuizellTrigger = void 0;
class QuizellTrigger {
    constructor() {
        this.description = {
            displayName: 'Quizell Trigger',
            name: 'quizellTrigger',
            icon: 'file:quizell.svg',
            group: ['trigger'],
            version: 1,
            description: 'Starts the workflow on Quizell events like Quiz Completed or Lead Captured',
            defaults: { name: 'Quizell Trigger' },
            inputs: [],
            outputs: ['main'],
            credentials: [
                {
                    name: 'quizellApi',
                    required: true,
                },
            ],
            webhooks: [
                {
                    name: 'default',
                    httpMethod: 'POST',
                    responseMode: 'onReceived',
                    path: 'webhook',
                },
            ],
            properties: [
                {
                    displayName: 'Event',
                    name: 'event',
                    type: 'options',
                    noDataExpression: true,
                    options: [
                        {
                            name: 'Quiz Completed',
                            value: 'quiz.completed',
                            description: 'Fires when a user completes a quiz',
                        },
                        {
                            name: 'Lead Captured',
                            value: 'lead.captured',
                            description: 'Fires when a new lead is captured via a quiz',
                        },
                    ],
                    default: 'quiz.completed',
                    required: true,
                },
            ],
        };
        this.webhookMethods = {
            default: {
                async checkExists() {
                    const webhookData = this.getWorkflowStaticData('node');
                    if (!webhookData.webhookId)
                        return false;
                    const credentials = await this.getCredentials('quizellApi');
                    try {
                        await this.helpers.request({
                            method: 'GET',
                            url: `${credentials.baseUrl}/api/n8n/webhooks/${webhookData.webhookId}`,
                            headers: { Authorization: `Bearer ${credentials.apiKey}` },
                            json: true,
                        });
                        return true;
                    }
                    catch {
                        return false;
                    }
                },
                async create() {
                    const webhookUrl = this.getNodeWebhookUrl('default');
                    const event = this.getNodeParameter('event');
                    const credentials = await this.getCredentials('quizellApi');
                    const webhookData = this.getWorkflowStaticData('node');
                    const response = await this.helpers.request({
                        method: 'POST',
                        url: `${credentials.baseUrl}/api/n8n/webhooks`,
                        headers: { Authorization: `Bearer ${credentials.apiKey}` },
                        body: {
                            url: webhookUrl,
                            event,
                        },
                        json: true,
                    });
                    webhookData.webhookId = response.id;
                    return true;
                },
                async delete() {
                    const credentials = await this.getCredentials('quizellApi');
                    const webhookData = this.getWorkflowStaticData('node');
                    if (!webhookData.webhookId)
                        return true;
                    try {
                        await this.helpers.request({
                            method: 'DELETE',
                            url: `${credentials.baseUrl}/api/n8n/webhooks/${webhookData.webhookId}`,
                            headers: { Authorization: `Bearer ${credentials.apiKey}` },
                            json: true,
                        });
                        webhookData.webhookId = undefined;
                    }
                    catch {
                        return false;
                    }
                    return true;
                },
            },
        };
    }
    async webhook() {
        const body = this.getBodyData();
        const headers = this.getHeaderData();
        const credentials = await this.getCredentials('quizellApi');
        if (headers['x-quizell-secret'] !== credentials.apiKey) {
            return { noWebhookResponse: true };
        }
        return {
            workflowData: [this.helpers.returnJsonArray(body)],
        };
    }
}
exports.QuizellTrigger = QuizellTrigger;
//# sourceMappingURL=QuizellTrigger.node.js.map