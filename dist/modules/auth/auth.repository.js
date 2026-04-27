"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthRepository = void 0;
const prisma_1 = __importDefault(require("../../config/prisma"));
class AuthRepository {
    async findTenantBySlug(slug) {
        return prisma_1.default.tenant.findUnique({ where: { slug } });
    }
    async findUserByEmail(email, tenantId) {
        return prisma_1.default.user.findUnique({
            where: {
                email_tenantId: {
                    email,
                    tenantId,
                },
            },
        });
    }
    async createTenantAndOwner(data) {
        return prisma_1.default.$transaction(async (tx) => {
            const tenant = await tx.tenant.create({
                data: {
                    name: data.tenantName,
                    slug: data.tenantSlug,
                },
            });
            const user = await tx.user.create({
                data: {
                    name: data.userName,
                    email: data.userEmail,
                    password: data.passwordHash,
                    role: 'OWNER',
                    tenantId: tenant.id,
                },
            });
            return { tenant, user };
        });
    }
    async saveRefreshToken(data) {
        return prisma_1.default.refreshToken.create({
            data,
        });
    }
    async findRefreshToken(token) {
        return prisma_1.default.refreshToken.findUnique({
            where: { token },
            include: { user: true },
        });
    }
    async deleteRefreshToken(token) {
        await prisma_1.default.refreshToken.delete({ where: { token } });
    }
    async deleteUserRefreshTokens(userId) {
        await prisma_1.default.refreshToken.deleteMany({ where: { userId } });
    }
}
exports.AuthRepository = AuthRepository;
