"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authorize = exports.authenticate = void 0;
const jwt_util_1 = require("../utils/jwt.util");
const api_error_1 = require("../utils/api-error");
const async_handler_1 = require("../utils/async-handler");
exports.authenticate = (0, async_handler_1.asyncHandler)(async (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        throw api_error_1.ApiError.unauthorized('Authentication required');
    }
    const token = authHeader.split(' ')[1];
    const decoded = (0, jwt_util_1.verifyAccessToken)(token);
    req.user = decoded;
    next();
});
const authorize = (...roles) => {
    return (req, res, next) => {
        if (!req.user || !roles.includes(req.user.role)) {
            throw api_error_1.ApiError.forbidden('Insufficient permissions');
        }
        next();
    };
};
exports.authorize = authorize;
