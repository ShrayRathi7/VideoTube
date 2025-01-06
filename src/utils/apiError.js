class apiError extends Error {
    constructor(
      statusCode,                // HTTP status code for the error (e.g., 400, 404, 500)
      message = "Something went wrong",  // Default error message
      errors = []                // Additional error details (e.g., validation errors)
    ) {
      super(message);            // Call the parent Error constructor with the message
      this.statusCode = statusCode; // Assign the HTTP status code to the error
      this.data = null;          // Optional: Can hold additional data related to the error
      this.message = message;    // Assign the error message
      this.success = false;      // Indicates the operation was unsuccessful
      this.errors = errors;      // An array of additional error details (if any)
    }
  }
  export {apiError}
  