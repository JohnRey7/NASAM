const AuditLogService = require('../services/AuditLogService');

/**
 * Middleware to automatically log all API interactions
 */
const auditLogMiddleware = (options = {}) => {
  const {
    excludePaths = ['/api/auth/me', '/api/files'], // Paths to exclude from logging
    excludeMethods = [], // HTTP methods to exclude
    logRequestBody = true,
    logResponseBody = false,
    logQueryParams = true,
    logHeaders = false,
    skipSuccessfulGets = false, // Skip logging successful GET requests
    logOnlyErrors = false // Only log failed requests (4xx, 5xx)
  } = options;

  return (req, res, next) => {
    // Skip if path is excluded
    if (shouldSkipLogging(req.path, excludePaths, req.method, excludeMethods)) {
      return next();
    }

    // Record start time for duration calculation
    const startTime = Date.now();

    // Store original methods
    const originalSend = res.send;
    const originalJson = res.json;
    const originalEnd = res.end;

    // Variables to capture response
    let responseBody = null;
    let responseSent = false;

    // Override res.json to capture response body
    res.json = function(body) {
      if (logResponseBody && !responseSent) {
        responseBody = body;
      }
      responseSent = true;
      return originalJson.call(this, body);
    };

    // Override res.send to capture response body
    res.send = function(body) {
      if (logResponseBody && !responseSent && typeof body === 'string') {
        try {
          responseBody = JSON.parse(body);
        } catch (e) {
          responseBody = body;
        }
      }
      responseSent = true;
      return originalSend.call(this, body);
    };

    // Override res.end to ensure we log when response ends
    res.end = function(chunk, encoding) {
      if (!responseSent) {
        responseSent = true;
      }
      return originalEnd.call(this, chunk, encoding);
    };

    // Listen for response finish to log the interaction
    res.on('finish', async () => {
      try {
        const duration = Date.now() - startTime;
        
        // Skip logging based on options
        if (skipSuccessfulGets && req.method === 'GET' && res.statusCode < 400) {
          return;
        }
        
        if (logOnlyErrors && res.statusCode < 400) {
          return;
        }

        // Prepare request data
        const requestData = {};
        
        if (logRequestBody && req.body && Object.keys(req.body).length > 0) {
          requestData.body = req.body;
        }
        
        if (logQueryParams && req.query && Object.keys(req.query).length > 0) {
          requestData.query = req.query;
        }
        
        if (req.params && Object.keys(req.params).length > 0) {
          requestData.params = req.params;
        }

        if (logHeaders && req.headers) {
          // Only log specific headers, not all
          requestData.headers = {
            'content-type': req.headers['content-type'],
            'user-agent': req.headers['user-agent'],
            'accept': req.headers['accept'],
            'origin': req.headers['origin']
          };
        }

        // Extract resource information from the request
        const { resourceType, resourceId } = extractResourceInfo(req);

        // Prepare audit log data
        const logData = {
          userId: req.user?._id || null,
          action: generateActionDescription(req),
          method: req.method,
          endpoint: req.route ? req.route.path : req.path,
          resourceType,
          resourceId,
          requestData: Object.keys(requestData).length > 0 ? requestData : null,
          responseStatus: res.statusCode,
          responseMessage: getResponseMessage(res.statusCode, responseBody),
          ipAddress: getClientIP(req),
          userAgent: req.get('User-Agent'),
          duration,
          metadata: {
            fullPath: req.originalUrl,
            baseUrl: req.baseUrl,
            protocol: req.protocol,
            hostname: req.hostname,
            responseSize: res.get('Content-Length')
          }
        };

        // Create audit log asynchronously (don't block response)
        await AuditLogService.createAuditLog(logData);
        
      } catch (error) {
        // Log error but don't affect the response
        console.error('Audit logging error:', error);
      }
    });

    next();
  };
};

/**
 * Check if request should skip logging
 */
function shouldSkipLogging(path, excludePaths, method, excludeMethods) {
  // Skip excluded methods
  if (excludeMethods.includes(method)) {
    return true;
  }

  // Skip excluded paths (exact match or pattern)
  return excludePaths.some(excludePath => {
    if (excludePath instanceof RegExp) {
      return excludePath.test(path);
    }
    return path.startsWith(excludePath);
  });
}

/**
 * Extract resource type and ID from request
 */
function extractResourceInfo(req) {
  let resourceType = null;
  let resourceId = null;

  // Extract from route path
  if (req.route && req.route.path) {
    const pathParts = req.route.path.split('/').filter(part => part);
    
    // Look for resource patterns like /api/users/:id
    for (let i = 0; i < pathParts.length; i++) {
      const part = pathParts[i];
      
      if (part === 'api') continue;
      
      // Check if next part is an ID parameter
      if (i + 1 < pathParts.length && pathParts[i + 1].startsWith(':')) {
        resourceType = part.replace(/s$/, ''); // Remove trailing 's' (users -> user)
        const paramName = pathParts[i + 1].substring(1); // Remove ':'
        resourceId = req.params[paramName];
        break;
      }
    }
  }

  // Fallback: extract from URL path
  if (!resourceType && req.path) {
    const pathParts = req.path.split('/').filter(part => part);
    if (pathParts.length >= 2 && pathParts[0] === 'api') {
      resourceType = pathParts[1].replace(/s$/, '');
      
      // Try to find ID in path
      if (pathParts.length >= 3) {
        const potentialId = pathParts[2];
        // Check if it looks like a MongoDB ObjectId or similar ID
        if (/^[a-fA-F0-9]{24}$/.test(potentialId) || /^\d+$/.test(potentialId)) {
          resourceId = potentialId;
        }
      }
    }
  }

  return { resourceType, resourceId };
}

/**
 * Generate human-readable action description
 */
function generateActionDescription(req) {
  const method = req.method.toUpperCase();
  const path = req.route ? req.route.path : req.path;
  
  // Extract resource from path
  const pathParts = path.split('/').filter(part => part && part !== 'api');
  let resource = pathParts[0] || 'resource';
  
  // Handle specific endpoint patterns
  if (path.includes('/login')) return 'User Login';
  if (path.includes('/logout')) return 'User Logout';
  if (path.includes('/register')) return 'User Registration';
  if (path.includes('/forgot-password')) return 'Password Reset Request';
  if (path.includes('/verify')) return 'Email Verification';
  if (path.includes('/upload')) return 'File Upload';
  if (path.includes('/download')) return 'File Download';
  if (path.includes('/pdf')) return 'PDF Export';
  if (path.includes('/restore')) return `Restore ${resource}`;
  if (path.includes('/soft')) return `Soft Delete ${resource}`;
  if (path.includes('/permanent')) return `Permanent Delete ${resource}`;
  if (path.includes('/disable')) return `Disable ${resource}`;
  if (path.includes('/enable')) return `Enable ${resource}`;
  if (path.includes('/approve')) return `Approve ${resource}`;
  if (path.includes('/reject')) return `Reject ${resource}`;
  
  // Standard CRUD operations
  const actionMap = {
    'GET': path.includes('/:') ? `View ${resource}` : `List ${resource}`,
    'POST': `Create ${resource}`,
    'PUT': `Update ${resource}`,
    'PATCH': `Modify ${resource}`,
    'DELETE': `Delete ${resource}`
  };

  return actionMap[method] || `${method} ${resource}`;
}

/**
 * Get response message from status code and response body
 */
function getResponseMessage(statusCode, responseBody) {
  // Try to extract message from response body
  if (responseBody && typeof responseBody === 'object') {
    if (responseBody.message) {
      return responseBody.message;
    }
    if (responseBody.error) {
      return responseBody.error;
    }
  }

  // Default messages based on status code
  const statusMessages = {
    200: 'Success',
    201: 'Created',
    400: 'Bad Request',
    401: 'Unauthorized',
    403: 'Forbidden',
    404: 'Not Found',
    409: 'Conflict',
    422: 'Validation Error',
    500: 'Internal Server Error'
  };

  return statusMessages[statusCode] || `HTTP ${statusCode}`;
}

/**
 * Get client IP address
 */
function getClientIP(req) {
  return req.ip || 
         req.connection.remoteAddress || 
         req.socket.remoteAddress ||
         (req.connection.socket ? req.connection.socket.remoteAddress : null) ||
         req.headers['x-forwarded-for']?.split(',')[0] ||
         req.headers['x-real-ip'] ||
         'Unknown';
}

/**
 * Middleware for manual audit logging
 */
const logAuditEvent = async (req, eventData) => {
  try {
    const logData = {
      userId: req.user?._id || null,
      action: eventData.action,
      method: req.method,
      endpoint: req.route ? req.route.path : req.path,
      resourceType: eventData.resourceType,
      resourceId: eventData.resourceId,
      responseStatus: 200, // Assume success for manual events
      responseMessage: eventData.message || 'Manual audit event',
      ipAddress: getClientIP(req),
      userAgent: req.get('User-Agent'),
      metadata: {
        ...eventData.metadata,
        manualEvent: true,
        timestamp: new Date()
      }
    };

    await AuditLogService.createAuditLog(logData);
  } catch (error) {
    console.error('Manual audit logging error:', error);
  }
};

module.exports = {
  auditLogMiddleware,
  logAuditEvent
};