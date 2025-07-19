import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';

describe('AuthController', () => {
  let controller: AuthController;
  let service: AuthService;

  const mockAuthService = {
    validateUser: jest.fn(),
    login: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    service = module.get<AuthService>(AuthService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('login', () => {
    it('should validate user and return login token', async () => {
      const loginDto: LoginDto = {
        username: 'testuser',
        password: 'password123',
      };

      const mockUser = { id: 'user-1', username: 'testuser' };
      const mockToken = { access_token: 'token123' };

      mockAuthService.validateUser.mockResolvedValue(mockUser);
      mockAuthService.login.mockReturnValue(mockToken);

      const result = await controller.login(loginDto);

      expect(service.validateUser).toHaveBeenCalledWith(loginDto.username, loginDto.password);
      expect(service.login).toHaveBeenCalledWith(mockUser);
      expect(result).toEqual(mockToken);
    });
  });
});
