import prisma from '../../config/prisma';
import { User, RefreshToken, Tenant } from '@prisma/client';

export class AuthRepository {
  async findTenantBySlug(slug: string): Promise<Tenant | null> {
    return prisma.tenant.findUnique({ where: { slug } });
  }

  async findUserByEmail(email: string, tenantId: string): Promise<User | null> {
    return prisma.user.findUnique({
      where: {
        email_tenantId: {
          email,
          tenantId,
        },
      },
    });
  }

  async createTenantAndOwner(data: {
    tenantName: string;
    tenantSlug: string;
    userName: string;
    userEmail: string;
    passwordHash: string;
  }): Promise<{ tenant: Tenant; user: User }> {
    return prisma.$transaction(async (tx) => {
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

  async saveRefreshToken(data: {
    token: string;
    userId: string;
    tenantId: string;
    expiresAt: Date;
  }): Promise<RefreshToken> {
    return prisma.refreshToken.create({
      data,
    });
  }

  async findRefreshToken(token: string): Promise<RefreshToken | null> {
    return prisma.refreshToken.findUnique({
      where: { token },
      include: { user: true },
    });
  }

  async deleteRefreshToken(token: string): Promise<void> {
    await prisma.refreshToken.delete({ where: { token } });
  }

  async deleteUserRefreshTokens(userId: string): Promise<void> {
    await prisma.refreshToken.deleteMany({ where: { userId } });
  }
}
