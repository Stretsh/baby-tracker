# API Design

## Overview

The API follows RESTful principles and uses Nuxt 4's server API routes. All endpoints return JSON responses and handle errors gracefully.

## Base URL

- Development: `http://localhost:3300/api`
- Production: `http://[your-local-ip]:3300/api`

## Authentication

For local network use, no authentication is required. Future versions could add simple password protection.

## Endpoints

### Feeding Records

#### GET `/api/feedings`
Get all feeding records with optional filtering and sorting.

**Query Parameters:**
- `sort`: `asc` | `desc` (default: `desc`)
- `limit`: Number of records to return (default: 50)
- `offset`: Number of records to skip (default: 0)
- `search`: Search term for food type and notes

**Response:**
```json
{
  "feedings": [
    {
      "id": 1,
      "feeding_time": "2024-01-15T19:00:00Z",
      "food_type": "Rice cereal",
      "notes": "Evening meal",
      "created_at": "2024-01-15T19:05:00Z",
      "updated_at": "2024-01-15T19:05:00Z"
    }
  ],
  "total": 1,
  "limit": 50,
  "offset": 0
}
```

#### POST `/api/feedings`
Create a new feeding record.

**Request Body:**
```json
{
  "feeding_time": "2024-01-15T19:00:00Z",
  "food_type": "Rice cereal",
  "notes": "Evening meal"
}
```

**Response:**
```json
{
  "id": 1,
  "feeding_time": "2024-01-15T19:00:00Z",
  "food_type": "Rice cereal",
  "notes": "Evening meal",
  "created_at": "2024-01-15T19:05:00Z",
  "updated_at": "2024-01-15T19:05:00Z"
}
```

#### PUT `/api/feedings/:id`
Update an existing feeding record.

**Request Body:**
```json
{
  "feeding_time": "2024-01-15T19:15:00Z",
  "food_type": "Rice cereal with banana",
  "notes": "Evening meal - added banana"
}
```

**Response:**
```json
{
  "id": 1,
  "feeding_time": "2024-01-15T19:15:00Z",
  "food_type": "Rice cereal with banana",
  "notes": "Evening meal - added banana",
  "created_at": "2024-01-15T19:05:00Z",
  "updated_at": "2024-01-15T19:20:00Z"
}
```

#### DELETE `/api/feedings/:id`
Delete a feeding record.

**Response:**
```json
{
  "success": true,
  "message": "Feeding record deleted successfully"
}
```

### Food Types

#### GET `/api/food-types`
Get list of unique food types for autocomplete.

**Query Parameters:**
- `search`: Filter food types by name
- `limit`: Maximum number of results (default: 20)

**Response:**
```json
{
  "food_types": [
    "Breast milk",
    "Banana",
    "Rice cereal",
    "Apple",
    "Yogurt"
  ]
}
```

#### GET `/api/food-types/recent`
Get recently used food types for quick buttons.

**Query Parameters:**
- `limit`: Number of recent foods (default: 8)

**Response:**
```json
{
  "recent_foods": [
    "Breast milk",
    "Banana",
    "Rice cereal",
    "Apple"
  ]
}
```

## Error Handling

All endpoints return consistent error responses:

```json
{
  "error": true,
  "message": "Error description",
  "code": "ERROR_CODE",
  "details": {} // Optional additional error details
}
```

**Common Error Codes:**
- `VALIDATION_ERROR`: Invalid request data
- `NOT_FOUND`: Resource not found
- `DATABASE_ERROR`: Database operation failed
- `INTERNAL_ERROR`: Server error

## Data Validation

### Feeding Record Validation
- `feeding_time`: Required, valid ISO 8601 timestamp
- `food_type`: Required, string, max 255 characters
- `notes`: Optional, string, max 1000 characters

### Example Validation Errors
```json
{
  "error": true,
  "message": "Validation failed",
  "code": "VALIDATION_ERROR",
  "details": {
    "feeding_time": "Required field",
    "food_type": "Must be less than 255 characters"
  }
}
```

## Rate Limiting

For local network use, no rate limiting is implemented. Future versions could add basic rate limiting.

## CORS

Configured to allow requests from any origin on the local network.

## Database Connection

Uses direct PostgreSQL queries with `pg` library for database operations with connection pooling and error handling.

## Example API Usage

### Create a feeding record
```javascript
const response = await fetch('/api/feedings', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    feeding_time: new Date().toISOString(),
    food_type: 'Breast milk',
    notes: 'Morning feeding'
  })
});

const feeding = await response.json();
```

### Get recent feedings
```javascript
const response = await fetch('/api/feedings?sort=desc&limit=10');
const data = await response.json();
console.log(data.feedings);
```

### Get food suggestions
```javascript
const response = await fetch('/api/food-types?search=breast');
const data = await response.json();
console.log(data.food_types); // ["Breast milk"]
```

### Quick save (current time only)
```javascript
const response = await fetch('/api/feedings', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    feeding_time: new Date().toISOString(),
    food_type: '',
    notes: ''
  })
});

const feeding = await response.json();
```

## Future Enhancements

- **Bulk Operations**: Import/export feeding data
- **Statistics**: Daily/weekly feeding summaries
- **Notifications**: Reminder system for feeding times
- **Backup**: Automatic data backup to cloud storage
