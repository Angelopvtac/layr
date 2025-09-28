# Intent Schema Documentation

The Intent Schema is the core data structure that Layr uses to understand what kind of application you want to build.

## Schema Structure

### Required Fields

- **`goal`** (string): Plain English description of what you want to build
  - Example: "I want to build a subscription service for project management"

### Optional Fields

- **`audience`** (string): Target user base
  - Values: `"business"` | `"consumer"` | `"internal"` | `"developer"`
  - Default: `"business"`

- **`capabilities`** (array): Features your app needs
  - Available options:
    - `"auth"` - User authentication
    - `"crud"` - Database operations
    - `"payments"` - Payment processing
    - `"email"` - Email notifications
    - `"files"` - File uploads
    - `"realtime"` - Real-time updates
    - `"search"` - Search functionality
    - `"analytics"` - Analytics dashboard

- **`auth`** (string): Authentication method
  - Values: `"none"` | `"magic_link"` | `"email_password"` | `"oauth"`
  - Default: `"none"`

- **`entities`** (array): Data models for your application
  - Each entity contains:
    - `name` (string): Entity name
    - `fields` (array): Field definitions
      - `name` (string): Field name
      - `type` (string): Field type (`"string"` | `"text"` | `"number"` | `"boolean"` | `"date"` | `"email"` | `"reference"` | `"enum"`)
      - `required` (boolean): Whether field is required
      - `to` (string): For reference fields, the entity to reference
      - `values` (array): For enum fields, possible values

- **`payments`** (object): Payment configuration
  - `provider` (string): Payment provider (`"stripe"`)
  - `model` (string): Payment model (`"none"` | `"one_time"` | `"subscription"`)
  - `tiers` (array): Pricing tiers
    - `name` (string): Tier name
    - `price` (number): Monthly price
    - `limits` (object): Feature limits

- **`brand`** (object): Branding information
  - `name` (string): Application name
  - `tagline` (string): Application tagline

## Example Intent

```json
{
  "goal": "Build a team collaboration platform for remote work",
  "audience": "business",
  "capabilities": ["auth", "crud", "realtime", "files"],
  "auth": "magic_link",
  "entities": [
    {
      "name": "Workspace",
      "fields": [
        { "name": "name", "type": "string", "required": true },
        { "name": "description", "type": "text" }
      ]
    },
    {
      "name": "Channel",
      "fields": [
        { "name": "name", "type": "string", "required": true },
        { "name": "workspace", "type": "reference", "to": "Workspace", "required": true },
        { "name": "isPrivate", "type": "boolean" }
      ]
    }
  ]
}
```

## Blueprint Selection

Layr automatically selects the most appropriate blueprint based on your intent:

- **SaaS Starter**: When `payments` capability is included
- **Community Mini**: When `auth` + `crud` + social features
- **Marketplace Lite**: When `payments` + `files` + two-sided
- **Form to DB**: When `crud` without `auth`
- **Static Landing**: Minimal capabilities, mainly content

## Validation

Use the CLI to validate your intent:

```bash
layr validate intent.json
```

This will check:
- Required fields are present
- Field types are valid
- Entity references exist
- Capability combinations make sense