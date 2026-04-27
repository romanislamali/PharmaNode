"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const auth_repository_1 = require("./auth.repository");
const api_error_1 = require("../../utils/api-error");
const jwt_util_1 = require("../../utils/jwt.util");
class AuthService {
    authRepository;
    constructor() {
        this.authRepository = new auth_repository_1.AuthRepository();
    }
    async register(data) {
        const existingTenant = await this.authRepository.findTenantBySlug(data.tenantSlug);
        if (existingTenant) {
            throw api_error_1.ApiError.badRequest('Tenant with this slug already exists');
        }
        const passwordHash = await bcryptjs_1.default.hash(data.password, 12);
        const { user, tenant } = await this.authRepository.createTenantAndOwner({
            tenantName: data.tenantName,
            tenantSlug: data.tenantSlug,
            userName: data.name,
            userEmail: data.email,
            passwordHash,
        });
        return { user, tenant };
    }
    async login(data) {
        const tenant = await this.authRepository.findTenantBySlug(data.tenantSlug);
        if (!tenant) {
            throw api_error_1.ApiError.unauthorized('Invalid credentials');
        }
        const user = await this.authRepository.findUserByEmail(data.email, tenant.id);
        if (!user) {
            throw api_error_1.ApiError.unauthorized('Invalid credentials');
        }
        const isPasswordValid = await bcryptjs_1.default.compare(data.password, user.password);
        if (!isPasswordValid) {
            throw api_error_1.ApiError.unauthorized('Invalid credentials');
        }
        const accessToken = (0, jwt_util_1.generateAccessToken)({
            userId: user.id,
            tenantId: user.tenantId,
            role: user.role,
        });
        const refreshToken = (0, jwt_util_1.generateRefreshToken)({
            userId: user.id,
            tenantId: user.tenantId,
            role: user.role,
        });
        // Store refresh token in DB
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 7); // 7 days
        await this.authRepository.saveRefreshToken({
            token: refreshToken,
            userId: user.id,
            tenantId: user.tenantId,
            expiresAt,
        });
        return {
            accessToken,
            refreshToken,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
            },
            tenant: {
                id: tenant.id,
                name: tenant.name,
                slug: tenant.slug,
            },
        };
    }
    async logout(token) {
        try {
            await this.authRepository.deleteRefreshToken(token);
        }
        catch (error) {
            // Ignore if token doesn't exist
        }
    }
    async refresh(token) {
        const decoded = (0, jwt_util_1.verifyRefreshToken)(token);
        const storedToken = await this.authRepository.findRefreshToken(token);
        if (!storedToken || storedToken.userId !== decoded.userId) {
            throw api_error_1.ApiError.unauthorized('Invalid refresh token');
        }
        if (storedToken.expiresAt < new Date()) {
            await this.authRepository.deleteRefreshToken(token);
            throw api_error_1.ApiError.unauthorized('Refresh token expired');
        }
        const accessToken = (0, jwt_util_1.generateAccessToken)({
            userId: decoded.userId,
            tenantId: decoded.tenantId,
            role: decoded.role,
        });
        return { accessToken };
    }
}
exports.AuthService = AuthService;
