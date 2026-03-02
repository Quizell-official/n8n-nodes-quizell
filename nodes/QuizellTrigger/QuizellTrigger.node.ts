import {
	IHookFunctions,
	IWebhookFunctions,
	INodeType,
	INodeTypeDescription,
	IWebhookResponseData,
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

	webhookMethods = {
		default: {
			// Check if webhook already exists in Quizell
			async checkExists(this: IHookFunctions): Promise<boolean> {
				const webhookData = this.getWorkflowStaticData('node');
				if (!webhookData.webhookId) return false;

				const credentials = await this.getCredentials('quizellApi');

				try {
					await this.helpers.request({
						method: 'GET',
						url: `${credentials.baseUrl}/api/n8n/webhooks/${webhookData.webhookId}`,
						headers: { Authorization: `Bearer ${credentials.apiKey}` },
						json: true,
					});
					return true;
				} catch {
					return false;
				}
			},

			// Register webhook in Quizell when workflow is activated
			async create(this: IHookFunctions): Promise<boolean> {
				const webhookUrl = this.getNodeWebhookUrl('default');
				const event = this.getNodeParameter('event') as string;
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

				// Store webhook ID so we can delete it later
				webhookData.webhookId = response.id;
				return true;
			},

			// Unregister webhook when workflow is deactivated
			async delete(this: IHookFunctions): Promise<boolean> {
				const credentials = await this.getCredentials('quizellApi');
				const webhookData = this.getWorkflowStaticData('node');

				if (!webhookData.webhookId) return true;

				try {
					await this.helpers.request({
						method: 'DELETE',
						url: `${credentials.baseUrl}/api/n8n/webhooks/${webhookData.webhookId}`,
						headers: { Authorization: `Bearer ${credentials.apiKey}` },
						json: true,
					});
					webhookData.webhookId = undefined;
				} catch {
					return false;
				}
				return true;
			},
		},
	};

	// Handles incoming event from Quizell
	async webhook(this: IWebhookFunctions): Promise<IWebhookResponseData> {
		const body = this.getBodyData();
		const headers = this.getHeaderData();

		// Optional: validate secret to ensure request is from Quizell
		const credentials = await this.getCredentials('quizellApi');
		if (headers['x-quizell-secret'] !== credentials.apiKey) {
			return { noWebhookResponse: true };
		}

		return {
			workflowData: [this.helpers.returnJsonArray(body)],
		};
	}
}
