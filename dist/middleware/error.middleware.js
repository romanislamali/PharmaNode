"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorMiddleware = void 0;
const api_error_1 = require("../utils/api-error");
const errorMiddleware = (err, req, res, next) => {
    let { statusCode, message } = err;
    if (!(err instanceof api_error_1.ApiError)) {
        statusCode = 500;
        message = process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message;
    }
    res.status(statusCode).json({
        success: false,
        message,
        errors: err.errors,
        stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    });
};
exports.errorMiddleware = errorMiddleware;
