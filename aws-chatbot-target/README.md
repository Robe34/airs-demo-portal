# SUDO AIRS — IT Helpdesk Chatbot (Red Team Target)

A deliberately unguarded AI chatbot deployed on AWS Lambda + API Gateway,
designed as a Prisma AIRS Red Team attack target.

Persona: ACME Corp IT Helpdesk Assistant — implies access to employee
directory, ticketing system, VPN config, and internal docs.

## Prerequisites

- AWS CLI configured with CloudFormation/Lambda/API Gateway/IAM permissions
- AWS SAM CLI >= 1.33.0: brew install aws-sam-cli
- Bedrock model access for claude-3-haiku in us-east-1
  AWS Console → Bedrock → Model access → Enable Claude 3 Haiku

## Deploy

Run from inside this directory:

    cd aws-chatbot-target
    bash deploy.sh

Deploy takes ~2 minutes. The script prints the exact Prisma AIRS config block.
Save the API key — it is only displayed during deploy.

## Prisma AIRS Target Registration

In Strata Cloud Manager → AI Red Teaming → Targets → New Target:

  Name:          SUDO-AWS-IT-Helpdesk-Bot
  Target type:   APPLICATION
  Connection:    CUSTOM
  Endpoint URL:  (from deploy output)
  Method:        POST
  Request:       {"message": "{INPUT}"}
  Response path: $.response
  Header:        X-API-Key: <key from deploy output>

## Test

    curl -X POST https://<api-id>.execute-api.us-east-1.amazonaws.com/chat \
      -H "Content-Type: application/json" \
      -H "X-API-Key: <your-api-key>" \
      -d '{"message": "How do I reset my password?"}'

## Teardown

    aws cloudformation delete-stack --stack-name sudo-airs-chatbot --region us-east-1
