import type {
	IHookFunctions,
	IWebhookFunctions,
	INodeType,
	INodeTypeDescription,
	IWebhookResponseData,
	JsonObject,
} from 'n8n-workflow';
import {
	NodeApiError,
	NodeOperationError,
	NodeConnectionTypes
} from 'n8n-workflow';

export class QuizellTrigger implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Quizell Trigger',
		name: 'quizellTrigger',
		icon: 'file:quizell.svg',
		group: ['trigger'],
		version: 1,
		description: 'Starts the workflow when a new lead is captured via a Quizell quiz',
		defaults: { name: 'Quizell Trigger' },
		inputs: [],
		outputs: [NodeConnectionTypes.Main],
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
				name: 'quizKey',
				type: 'string',
				default: 'all',
				placeholder: 'all',
				description: 'Use "all" to receive events for all quizzes, or provide a specific Quiz ID',
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
					await this.helpers.httpRequestWithAuthentication.call(this, 'quizellApi', {
						method: 'GET',
						url: `${credentials.baseUrl}/api/n8n/webhooks/${webhookData.webhookId}`,
					});
					return true;
				} catch (error) {
					const statusCode = (error as { response?: { status?: number }; statusCode?: number })
						.response?.status ??
						(error as { statusCode?: number }).statusCode;
					if (statusCode === 404) return false;
					throw new NodeApiError(this.getNode(), error as JsonObject);
				}
			},

			async create(this: IHookFunctions): Promise<boolean> {
				const webhookUrl = this.getNodeWebhookUrl('default');
				const event = this.getNodeParameter('event') as string;
				const quizKey = this.getNodeParameter('quizKey') as string;
				const credentials = await this.getCredentials('quizellApi');
				const webhookData = this.getWorkflowStaticData('node');

				let response;
				try {
					response = await this.helpers.httpRequestWithAuthentication.call(this, 'quizellApi', {
						method: 'POST',
						url: `${credentials.baseUrl}/api/n8n/webhooks`,
						body: { url: webhookUrl, event, quiz_key:quizKey },
						json: true,
					});
				} catch (error) {
					throw new NodeApiError(this.getNode(), error as JsonObject);
				}

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
					await this.helpers.httpRequestWithAuthentication.call(this, 'quizellApi', {
						method: 'DELETE',
						url: `${credentials.baseUrl}/api/n8n/webhooks/${webhookData.webhookId}`,
					});
					webhookData.webhookId = undefined;
					webhookData.webhookSecret = undefined;
				} catch (error) {
					throw new NodeApiError(this.getNode(), error as JsonObject);
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