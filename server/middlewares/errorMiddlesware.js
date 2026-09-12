class ErrorHandler extends Error {
    constructor(message, statusCode) {
      super(message);
      this.statusCode = statusCode;
    }
  }
  
  export const errorMiddleware = (err, req, res, next) => {
    err.statusCode = err.statusCode || 500;
    err.message = err.message || "Internal Server Error";
  
    // Handle multiple validation errors (from the latest image)
    let errorMessage = err.errors
      ? Object.values(err.errors)
          .map((error) => error.message)
          .join(" ")
      : err.message;
  
    // Wrong MongoDB ID error (CastError)
    if (err.name === "CastError") {
      const message = `Resource not found. Invalid: ${err.path}`;
      err = new ErrorHandler(message, 400);
    }
  
    // Database duplicate key errors (MongoDB and PostgreSQL)
    if (err.code === 11000 || err.code === "23505") {
      const message = `Duplicate field value entered`;
      err = new ErrorHandler(message, 400);
      errorMessage = message;
    }
  
    // Wrong JWT error
    if (err.name === "JsonWebTokenError") {
      const message = `Json Web Token is invalid, try again`;
      err = new ErrorHandler(message, 400);
    }
  
    // JWT EXPIRE error
    if (err.name === "TokenExpiredError") {
      const message = `JSON Web Token has expired, try again`;
      err = new ErrorHandler(message, 400);
    }
  
    // Final response (from the latest image)
    return res.status(err.statusCode).json({
      success: false,
      message: errorMessage,
    });
  };
  
  export default ErrorHandler;
