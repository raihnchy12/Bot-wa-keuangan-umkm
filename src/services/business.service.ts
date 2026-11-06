import { AppError } from '../utils/appError';
import { businessRepository } from '../repositories/business.repository';
import { userService } from './user.service';

export class BusinessService {
  async createBusinessForUser(userId: string, businessName: string) {
    // Validate user exists
    const user = await userService.findUserById(userId);

    if (!user) {
      throw new AppError(`User dengan ID ${userId} tidak ditemukan`, 404);
    }

    // Create business for user
    const business = await businessRepository.create({
      userId,
      name: businessName,
    });

    return business;
  }

  async getBusinessByUserId(userId: string) {
    const business = await businessRepository.findByUserId(userId);

    if (!business) {
      throw new AppError(`Bisnis untuk user ${userId} tidak ditemukan`, 404);
    }

    return business;
  }

  async getBusinessById(id: string, userId: string) {
    const business = await businessRepository.findById(id, userId);

    if (!business) {
      throw new AppError(
        `Bisnis dengan ID ${id} tidak ditemukan atau tidak milik user ini`,
        404
      );
    }

    return business;
  }
}

export const businessService = new BusinessService();
