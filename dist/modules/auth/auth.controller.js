"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthController = void 0;
const auth_service_1 = require("./auth.service");
const async_handler_1 = require("../../utils/async-handler");
class AuthController {
    authService;
    constructor() {
        this.authService = new auth_service_1.AuthService();
    }
    register = (0, async_handler_1.asyncHandler)(async (req, res) => {
        const result = await this.authService.register(req.body);
        res.status(201).json({
            success: true,
            message: 'Tenant and user created successfully',
            data: result,
        });
    });
    login = (0, async_handler_1.asyncHandler)(async (req, res) => {
        const result = await this.authService.login(req.body);
        res.status(200).json({
            success: true,
            message: 'Login successful',
            data: result,
        });
    });
    logout = (0, async_handler_1.asyncHandler)(async (req, res) => {
        const { refreshToken } = req.body;
        if (refreshToken) {
            await this.authService.logout(refreshToken);
        }
        res.status(200).json({
            success: true,
            message: 'Logged out successfully',
        });
    });
    refresh = (0, async_handler_1.asyncHandler)(async (req, res) => {
        const { refreshToken } = req.body;
        const result = await this.authService.refresh(refreshToken);
        res.status(200).json({
            success: true,
            data: result,
        });
    });
}
exports.AuthController = AuthController;
