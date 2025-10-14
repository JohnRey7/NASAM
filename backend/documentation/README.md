# NASAM Backend API Documentation

This directory contains the complete OpenAPI 3.1.1 documentation for the NASAM (Nasionalismo Assessment and Management) Backend API.

## Documentation Structure

The documentation is organized in a modular way to maintain clarity and ease of maintenance:

### Main Files
- **`openapi.yml`** - Main OpenAPI specification file that references all other modules
- **`README.md`** - This documentation guide

### Components Directory (`/components/`)
Contains reusable components that are referenced throughout the API documentation:

- **`schemas.yml`** - All data models and schemas (User, Application, Document, etc.)
- **`responses.yml`** - Common HTTP response definitions
- **`parameters.yml`** - Reusable parameters (path, query, header parameters)
- **`examples.yml`** - Example data for requests and responses

### Paths Directory (`/paths/`)
Contains endpoint definitions organized by functionality:

- **`auth.yml`** - Authentication endpoints (login, register, logout, etc.)
- **`users.yml`** - User management endpoints
- **`roles.yml`** - Role and permission management endpoints
- **`applications.yml`** - Application form management endpoints
- **`documents.yml`** - Basic document management endpoints
- **`document-uploads.yml`** - Enhanced document upload endpoints
- **`interviews.yml`** - Interview scheduling and management endpoints
- **`personality-tests.yml`** - Personality test administration endpoints
- **`evaluations.yml`** - User evaluation and assessment endpoints
- **`departments.yml`** - Department management endpoints
- **`notifications.yml`** - Notification system endpoints
- **`files.yml`** - File download endpoints
- **`oas.yml`** - OAS staff specific operations endpoints
- **`basic.yml`** - Basic API endpoints

## Features Documented

### Authentication & Authorization
- JWT-based authentication using HTTP-only cookies
- Role-based permission system
- Email verification and password reset

### User Management
- User CRUD operations
- Account enable/disable functionality
- Soft delete with restore capabilities

### Application Management
- Application form creation and management
- Status tracking and approval workflows
- PDF export functionality
- Auto-completion features

### Document Management
- File upload with validation
- Multiple document types support
- Metadata management
- Soft delete and restore

### Interview System
- Interview scheduling
- Status management (scheduled, completed, cancelled, rescheduled)
- Interviewer assignment

### Personality Testing
- Test template management
- Test administration and answering
- Progress tracking and scoring

### Evaluation System
- User performance evaluation
- Criteria-based scoring
- Timekeeping records

### Department Management
- Department creation and management
- Department head assignment
- Hierarchical organization

### Notification System
- Real-time notifications
- Read/unread status tracking
- Bulk operations

### OAS Staff Operations
- Enhanced application management
- Dashboard statistics
- Bulk status updates

## API Standards

### HTTP Methods
- **GET** - Retrieve data
- **POST** - Create new resources
- **PATCH** - Partial updates
- **PUT** - Full updates or specific operations
- **DELETE** - Remove resources (usually soft delete)

### Response Format
All API responses follow a consistent format:
```json
{
  "success": boolean,
  "message": "string",
  "data": object|array,
  "error": "string" // only in error responses
}
```

### Status Codes
- **200** - Success
- **201** - Created
- **400** - Bad Request
- **401** - Unauthorized
- **403** - Forbidden
- **404** - Not Found
- **409** - Conflict
- **500** - Internal Server Error

### Pagination
List endpoints support pagination with these query parameters:
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 10, max: 100)

### Filtering and Sorting
Many endpoints support:
- `search` - Text search
- `sortBy` - Field to sort by
- `sortOrder` - Sort direction (asc/desc)
- Various field-specific filters

### File Uploads
File uploads use `multipart/form-data` with:
- File size limits
- MIME type validation
- Multiple file support

### Soft Delete Pattern
Most resources support soft delete operations:
- `DELETE /{resource}/{id}/soft` - Soft delete
- `PUT /{resource}/{id}/restore` - Restore soft-deleted
- `DELETE /{resource}/{id}/permanent` - Permanent delete
- `GET /{resource}/deleted` - List soft-deleted items

## Security

### Authentication
- JWT tokens stored in HTTP-only cookies
- Token expiration and refresh mechanisms
- Secure cookie settings in production

### Permissions
The API uses a granular permission system with permissions like:
- `user.create`, `user.read`, `user.update`, `user.delete`
- `application.create`, `application.readOwn`, `application.read`
- `document.upload`, `document.get`, `document.delete`
- And many more specific permissions

### File Security
- File type validation
- File size limits
- Secure file storage
- Access control for file downloads

## Usage

### Viewing the Documentation
1. Use any OpenAPI-compatible documentation viewer
2. Load the main `openapi.yml` file
3. The viewer will automatically resolve all references

### Popular Documentation Viewers
- Swagger UI
- ReDoc
- Postman (import OpenAPI spec)
- Insomnia (import OpenAPI spec)
- VS Code OpenAPI extensions

### Testing the API
1. Set up authentication by logging in first
2. Use the JWT token for subsequent requests
3. Follow the permission requirements for each endpoint
4. Test error scenarios with invalid data

## Maintenance

### Adding New Endpoints
1. Create or update the appropriate path file in `/paths/`
2. Add any new schemas to `/components/schemas.yml`
3. Update the main `openapi.yml` file to reference new paths
4. Add examples to `/components/examples.yml` if needed

### Updating Schemas
1. Modify schemas in `/components/schemas.yml`
2. Update examples in `/components/examples.yml`
3. Ensure all references are still valid

### Version Control
- Keep documentation in sync with API implementation
- Use semantic versioning for API changes
- Document breaking changes clearly

## Notes

- All timestamps are in ISO 8601 format
- All IDs are MongoDB ObjectIds (24-character hex strings)
- File uploads support PDF, JPG, PNG formats
- Maximum file size varies by endpoint
- Rate limiting may apply to certain endpoints
- Some endpoints require specific roles or permissions

For implementation details and server setup, refer to the main project documentation.