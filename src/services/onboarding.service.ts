import { Prisma } from '@prisma/client';
import { prisma } from '../config/db';

export interface OnboardingResult {
  user: {
    id: string;
    name: string;
    phoneNumber: string;
    createdAt: Date;
    updatedAt: Date;
  };
  business: {
    id: string;
    userId: string;
    name: string;
    createdAt: Date;
    updatedAt: Date;
  };
  isNewUser: boolean;
}

export class OnboardingService {
  async getOrCreateUserAndBusiness(
    phoneNumber: string,
    pushName: string,
    isRetry = false
  ): Promise<OnboardingResult> {
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { phoneNumber },
      include: { businesses: true },
    });

    // If user exists, return existing user and business
    if (existingUser && existingUser.businesses.length > 0) {
      return {
        user: existingUser,
        business: existingUser.businesses[0],
        isNewUser: false,
      };
    }

    // If user doesn't exist, create both User and Business atomically
    if (!existingUser) {
      try {
        const result = await prisma.$transaction(async (tx) => {
          // Create new user
          const newUser = await tx.user.create({
            data: {
              name: pushName,
              phoneNumber,
            },
          });

          // Create new business for the user
          const newBusiness = await tx.business.create({
            data: {
              userId: newUser.id,
              name: pushName,
            },
          });

          return { user: newUser, business: newBusiness };
        });

        return {
          user: result.user,
          business: result.business,
          isNewUser: true,
        };
      } catch (error) {
        // Race condition: pesan lain dari nomor yang sama sudah membuat user lebih dulu
        // (unique constraint pada phoneNumber). Ambil ulang data yang sudah ada.
        if (
          !isRetry &&
          error instanceof Prisma.PrismaClientKnownRequestError &&
          error.code === 'P2002'
        ) {
          console.warn(
            `[Onboarding] Concurrent onboarding detected for ${phoneNumber}, re-fetching existing user`
          );
          return this.getOrCreateUserAndBusiness(phoneNumber, pushName, true);
        }
        throw error;
      }
    }

    // If user exists but no business, create business for existing user
    const newBusiness = await prisma.business.create({
      data: {
        userId: existingUser.id,
        name: pushName,
      },
    });

    return {
      user: existingUser,
      business: newBusiness,
      isNewUser: false,
    };
  }
}

export const onboardingService = new OnboardingService();