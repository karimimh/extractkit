# API Uptime + Contract Testing Monitor

## Overview

API Uptime + Contract Testing Monitor is a SaaS platform that continuously checks whether APIs are online, responding correctly, and maintaining their expected response structure.

Unlike a basic uptime monitor, this product verifies both availability and correctness.

## Target Users

- SaaS companies
- Backend developers
- API-first startups
- Web agencies
- DevOps teams
- Internal engineering teams
- Companies with public or private APIs

## Core Problem

APIs can be technically online but still broken.

A health endpoint may return `200 OK`, while important API responses have changed, required fields are missing, authentication is failing, or latency has increased.

## Main Value Proposition

> Monitor API uptime, latency, response structure, and breaking changes before your users or customers discover the problem.

---

## MVP Features

### 1. User Authentication

Users should be able to:

- Sign up
- Log in
- Reset password
- Manage profile settings

### 2. Workspace / Team Management

Users should be able to:

- Create a workspace
- Invite team members
- Assign roles
- Manage API projects

### 3. API Project Management

Users should be able to:

- Create projects
- Group endpoints by project
- Add environment names such as production, staging, or development
- Manage API base URLs

### 4. Endpoint Monitoring

Users should be able to define:

- Endpoint URL
- HTTP method
- Headers
- Query parameters
- Request body
- Authentication details
- Expected status code
- Expected response time
- Check frequency

Supported HTTP methods:

- GET
- POST
- PUT
- PATCH
- DELETE

### 5. Scheduled API Checks

The system should:

- Run checks on a schedule
- Store response status
- Store response time
- Store response body sample
- Detect failed requests
- Detect timeout errors
- Detect authentication errors

### 6. Uptime Dashboard

Users should be able to see:

- Current status
- Uptime percentage
- Average response time
- Recent failures
- Failed endpoints
- Slow endpoints
- Last successful check
- Last failed check

### 7. Contract Testing

Users should be able to define expected API response schemas.

The monitor should validate:

- Required fields
- Field types
- Nested objects
- Arrays
- Nullable fields
- Unexpected missing fields
- Unexpected type changes

Example issue:

```json
{
  "expected": "user.email as string",
  "received": "user.email missing"
}
```

### 8. JSON Schema Support

Users should be able to:

- Paste JSON Schema
- Generate schema from sample response
- Edit generated schema
- Validate responses against the schema

### 9. Alerting

Send alerts when:

- API is down
- Endpoint returns unexpected status code
- Response time exceeds threshold
- Contract validation fails
- SSL certificate is close to expiry
- Error rate increases

Alert channels:

- Email
- Slack webhook
- Discord webhook
- Microsoft Teams webhook

### 10. Incident History

Users should be able to view:

- Incident start time
- Incident end time
- Affected endpoints
- Failure reason
- Downtime duration
- Contract errors
- Response samples

---

## Advanced Features

### 1. Multi-Step API Flows

Support chained API tests such as:

1. Log in
2. Extract token
3. Create resource
4. Fetch resource
5. Delete resource

### 2. Dynamic Variables

Allow users to define variables such as:

- Auth token
- Base URL
- User ID
- API key
- Random email
- Timestamp

### 3. Response Assertions

Users should be able to create custom assertions:

- Response contains value
- Response field equals value
- Response array length is greater than value
- Response time is below threshold
- Header exists
- Header value matches expected value

### 4. OpenAPI Import

Users should be able to:

- Import OpenAPI / Swagger files
- Generate endpoint monitors automatically
- Generate schemas from OpenAPI specs
- Detect differences between live responses and documentation

### 5. API Diffing

Track changes in API responses over time.

Detect:

- Added fields
- Removed fields
- Type changes
- Changed enum values
- Changed required fields

### 6. Public Status Pages

Allow users to create status pages showing:

- API uptime
- Current operational status
- Recent incidents
- Scheduled maintenance

### 7. Regional Monitoring

Run checks from multiple regions.

Examples:

- London
- Frankfurt
- New York
- Singapore

### 8. Webhook Alerts

Allow customers to send alerts into their own systems.

### 9. CI/CD Integration

Allow API checks to run during deployment pipelines.

Integrations:

- GitHub Actions
- GitLab CI
- Bitbucket Pipelines
- CircleCI

### 10. AI Incident Summary

Generate readable summaries such as:

> The `/api/users` endpoint started failing at 14:03 UTC because the `email` field was removed from the response. This broke the expected contract for two monitors.

---

## Suggested Data Models

### User

- id
- name
- email
- password_hash
- created_at
- updated_at

### Workspace

- id
- name
- owner_id
- plan
- created_at
- updated_at

### Project

- id
- workspace_id
- name
- base_url
- environment
- created_at
- updated_at

### EndpointMonitor

- id
- project_id
- name
- method
- url
- headers
- query_params
- body
- auth_type
- expected_status
- expected_response_time_ms
- frequency_minutes
- active
- created_at
- updated_at

### ApiCheck

- id
- endpoint_monitor_id
- status
- status_code
- response_time_ms
- response_body_sample
- error_message
- checked_at

### ContractSchema

- id
- endpoint_monitor_id
- schema_json
- created_at
- updated_at

### ContractViolation

- id
- api_check_id
- endpoint_monitor_id
- violation_type
- path
- expected
- received
- message
- created_at

### Incident

- id
- project_id
- endpoint_monitor_id
- status
- started_at
- resolved_at
- failure_reason
- duration_seconds

### AlertChannel

- id
- workspace_id
- type
- name
- config
- active
- created_at
- updated_at

---

## Possible Tech Stack

### Frontend

- Next.js
- React
- Tailwind CSS
- shadcn/ui
- Recharts

### Backend

- Node.js
- NestJS or Fastify
- PostgreSQL
- Redis
- BullMQ

### API Testing Engine

- Axios / undici
- AJV for JSON Schema validation
- OpenAPI parser
- Cron-based job queue

### Infrastructure

- Docker
- PostgreSQL
- Redis
- S3-compatible storage
- Worker services
- Optional regional workers

---

## Monetization

### Developer

For solo developers and small projects.

- 10 monitors
- 1-minute or 5-minute checks
- Email alerts
- Basic contract testing

### Team

For small engineering teams.

- 100 monitors
- Slack alerts
- JSON Schema validation
- Incident history
- Team members

### Business

For serious API teams.

- 500+ monitors
- Multi-step flows
- Status pages
- OpenAPI import
- Regional checks
- CI/CD integration
