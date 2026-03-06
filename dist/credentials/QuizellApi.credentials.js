"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.QuizellApi = void 0;
class QuizellApi {
    constructor() {
        this.name = 'quizellApi';
        this.displayName = 'Quizell API';
        this.documentationUrl = 'https://docs.quizell.com/';
        this.properties = [
            {
                displayName: 'API TOKEN',
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
        this.authenticate = {
            type: 'generic',
            properties: {
                headers: {
                    Authorization: '={{"Bearer " + $credentials.apiKey}}',
                },
            },
        };
        this.test = {
            request: {
                baseURL: '={{$credentials.baseUrl}}',
                url: '/api/n8n/verify',
                method: 'GET',
            },
        };
    }
}
exports.QuizellApi = QuizellApi;
//# sourceMappingURL=QuizellApi.credentials.js.map