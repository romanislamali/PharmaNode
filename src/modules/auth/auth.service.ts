import bcrypt from 'bcryptjs';
import { AuthRepository } from './auth.repository';
import { ApiError } from '../../utils/api-error';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from '../../utils/jwt.util';

export class AuthService {
  private authRepository: AuthRepository;

  constructor() {
    this.authRepository = new AuthRepository();
  }

  async register(data: any) {
    const existingTenant = await this.authRepository.findTenantBySlug(data.tenantSlug);
    if (existingTenant) {
      throw ApiError.badRequest('Tenant with this slug already exists');
    }

    const passwordHash = await bcrypt.hash(data.password, 12);

    const { user, tenant } = await this.authRepository.createTenantAndOwner({
      tenantName: data.tenantName,
      tenantSlug: data.tenantSlug,
      userName: data.name,
      userEmail: data.email,
      passwordHash,
    });

    return { user, tenant };
  }

  async login(data: any) {
    const tenant = await this.authRepository.findTenantBySlug(data.tenantSlug);
    if (!tenant) {
      throw ApiError.unauthorized('Invalid credentials');
    }

    const user = await this.authRepository.findUserByEmail(data.email, tenant.id);
    if (!user) {
      throw ApiError.unauthorized('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(data.password, user.password);
    if (!isPasswordValid) {
      throw ApiError.unauthorized('Invalid credentials');
    }

    const accessToken = generateAccessToken({
      userId: user.id,
      tenantId: user.tenantId,
      role: user.role,
    });

    const refreshToken = generateRefreshToken({
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

  async logout(token: string) {
    try {
      await this.authRepository.deleteRefreshToken(token);
    } catch (error) {
      // Ignore if token doesn't exist
    }
  }

  async refresh(token: string) {
    const decoded = verifyRefreshToken(token);
    const storedToken = await this.authRepository.findRefreshToken(token);

    if (!storedToken || storedToken.userId !== decoded.userId) {
      throw ApiError.unauthorized('Invalid refresh token');
    }

    if (storedToken.expiresAt < new Date()) {
      await this.authRepository.deleteRefreshToken(token);
      throw ApiError.unauthorized('Refresh token expired');
    }

    const accessToken = generateAccessToken({
      userId: decoded.userId,
      tenantId: decoded.tenantId,
      role: decoded.role,
    });

    return { accessToken };
  }
}
