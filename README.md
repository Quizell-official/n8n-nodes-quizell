# n8n-nodes-quizell

This is an n8n community node for [Quizell](https://quizell.com).

Quizell is a quiz and lead capture platform. This node lets you trigger
n8n workflows when quizzes are completed or leads are captured.

[n8n](https://n8n.io/) is a fair-code licensed workflow automation platform.

## Installation

Follow the [installation guide](https://docs.n8n.io/integrations/community-nodes/installation/)
in the n8n community nodes documentation.

## Operations

- **Lead Captured** — triggers when a new lead is captured via a quiz

## Credentials

You need a Quizell API key to use this node.

1. Log in to your Quizell dashboard
2. Go to **Integrations → API**
3. Copy your API key
4. In n8n, create a new **Quizell API** credential and paste the key

## Configuration

| Field     | Description                                      |
|-----------|--------------------------------------------------|
| Event     | The Quizell event to listen for                  |
| Quiz Key  | Specific quiz ID, or `all` for all quizzes       |

## Compatibility

Tested with n8n version 1.0+

## Resources

- [n8n community nodes documentation](https://docs.n8n.io/integrations/community-nodes/)
- [Quizell documentation](https://quizell.com/docs)

## License

MIT