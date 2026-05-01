import type { Icon } from 'n8n-workflow';
import type {
	IAuthenticateGeneric,
	ICredentialTestRequest,
	ICredentialType,
	INodeProperties,
} from 'n8n-workflow';

export class QuizellApi implements ICredentialType {
	name = 'quizellApi';
	displayName = 'Quizell API';
	icon: Icon = 'file:quizell.svg';
	documentationUrl = 'https://docs.quizell.com/';
	properties: INodeProperties[] = [
		{
			displayName: 'API Key',
			name: 'apiKey',
			type: 'string',
			typeOptions: { password: true },
			default: '',
			required: true,
			hint: 'Find your API key in Quizell dashboard → Integrations → API',
		},
		{
			displayName: 'Base URL',
			name: 'baseUrl',
			type: 'string',
			default: 'https://api.quizell.com',
			required: true,
		},
	];

	// Tells n8n how to inject the API key into requests automatically
	authenticate: IAuthenticateGeneric = {
		type: 'generic',
		properties: {
			headers: {
				Authorization: '={{"Bearer " + $credentials.apiKey}}',
			},
		},
	};

	// n8n will test this endpoint when user clicks "Test Credential"
	test: ICredentialTestRequest = {
		request: {
			baseURL: '={{$credentials.baseUrl}}',
			url: '/api/n8n/verify',
			method: 'GET',
		},
	};
}