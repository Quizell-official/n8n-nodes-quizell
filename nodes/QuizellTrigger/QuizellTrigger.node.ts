import {
	IHookFunctions,
	IWebhookFunctions,
	INodeType,
	INodeTypeDescription,
	IWebhookResponseData,
	NodeOperationError,
} from 'n8n-workflow';

export class QuizellTrigger implements INodeType {
	description: INodeTypeDescription = {
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
				path: '/',
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
						name: 'Lead Captured',
						value: 'lead.captured',
						description: 'Fires when a new lead is captured via a quiz',
					},
				],
				default: 'lead.captured',
				required: true,
			},
			{
				displayName: 'Quiz Key (Quiz ID)',
				name: 'quiz_key',
				type: 'string',
				default: 'all',
				placeholder: 'all',
				description: 'Use "all" to receive events for all quizzes, or provide a specific Quiz ID.',
				required: true,
				displayOptions: {
					show: {
						event: ['lead.captured'],
					},
				},
			},
		],
	};

	webhookMethods = {
		default: {
			async checkExists(this: IHookFunctions): Promise<boolean> {
				const webhookData = this.getWorkflowStaticData('node');
				if (!webhookData.webhookId) return false;

				const credentials = await this.getCredentials('quizellApi');

				try {
					await this.helpers.httpRequest({
						method: 'GET',
						url: `${credentials.baseUrl}/api/n8n/webhooks/${webhookData.webhookId}`,
						headers: { Authorization: `Bearer ${credentials.apiKey}` },
					});
					return true;
				} catch {
					return false;
				}
			},

			async create(this: IHookFunctions): Promise<boolean> {
				const webhookUrl = this.getNodeWebhookUrl('default');
				const event = this.getNodeParameter('event') as string;
				const quiz_key = this.getNodeParameter('quiz_key') as string;
				const credentials = await this.getCredentials('quizellApi');
				const webhookData = this.getWorkflowStaticData('node');

				const response = await this.helpers.httpRequest({
					method: 'POST',
					url: `${credentials.baseUrl}/api/n8n/webhooks`,
					headers: {
						Authorization: `Bearer ${credentials.apiKey}`,
						'Content-Type': 'application/json',
					},
					body: { url: webhookUrl, event, quiz_key },
					json: true,
				});

				webhookData.webhookId = response.id;

				if (!response.secret) {
					throw new NodeOperationError(this.getNode(), 'Quizell API did not return a webhook secret. Cannot securely receive events.');
				}

				webhookData.webhookSecret = response.secret;
				return true;
			},

			async delete(this: IHookFunctions): Promise<boolean> {
				const credentials = await this.getCredentials('quizellApi');
				const webhookData = this.getWorkflowStaticData('node');

				if (!webhookData.webhookId) return true;

				try {
					await this.helpers.httpRequest({
						method: 'DELETE',
						url: `${credentials.baseUrl}/api/n8n/webhooks/${webhookData.webhookId}`,
						headers: { Authorization: `Bearer ${credentials.apiKey}` },
					});
					webhookData.webhookId = undefined;
					webhookData.webhookSecret = undefined;
				} catch {
					return false;
				}
				return true;
			},
		},
	};

	async webhook(this: IWebhookFunctions): Promise<IWebhookResponseData> {
		const body = this.getBodyData();
		const headers = this.getHeaderData();
		const webhookData = this.getWorkflowStaticData('node');

		if (webhookData.webhookSecret && headers['x-quizell-secret'] !== webhookData.webhookSecret) {
			return { noWebhookResponse: true };
		}

		return {
			workflowData: [this.helpers.returnJsonArray(body)],
		};
	}
}