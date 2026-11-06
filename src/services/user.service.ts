import { AppError } from '../utils/appError';
import { userRepository, CreateUserInput } from '../repositories/user.repository';

export class UserService {
  async findUserByPhoneNumber(phoneNumber: string) {
    const user = await userRepository.findByPhoneNumber(phoneNumber);
    return user;
  }

  async createUser(data: CreateUserInput) {
    // Check if user with this phone number already exists
    const existingUser = await userRepository.findByPhoneNumber(data.phoneNumber);

    if (existingUser) {
      throw new AppError(
        `User dengan nomor WhatsApp ${data.phoneNumber} sudah terdaftar`,
        409
      );
    }

    // Create new user
    const user = await userRepository.create(data);
    return user;
  }

  async findUserById(id: string) {
    const user = await userRepository.findById(id);

    if (!user) {
      throw new AppError(`User dengan ID ${id} tidak ditemukan`, 404);
    }

    return user;
  }
}

export const userService = new UserService();
