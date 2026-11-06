import { prisma } from '../config/db';

export interface CreateUserInput {
  name: string;
  phoneNumber: string;
}

export class UserRepository {
  async findByPhoneNumber(phoneNumber: string) {
    return prisma.user.findUnique({
      where: { phoneNumber },
    });
  }

  async create(data: CreateUserInput) {
    return prisma.user.create({
      data,
    });
  }

  async findById(id: string) {
    return prisma.user.findUnique({
      where: { id },
    });
  }
}

export const userRepository = new UserRepository();
