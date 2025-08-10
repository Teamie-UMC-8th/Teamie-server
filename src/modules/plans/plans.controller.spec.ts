import { describe } from 'node:test';
import { PlansController } from './plans.controller';
import { PlansService } from './services/plans.service';
import { TestingModule, Test } from '@nestjs/testing';
import { PlanDetails } from './dtos/plan-details.dto';
import { ProjectForbiddenException } from 'src/common/exceptions/custom.errors';
import { PlansGateway } from './gateways/plans.gateway';
import { Plan } from './entities/plan.entity';

describe('PlansController', () => {
    let controller: PlansController;
    let service: PlansService;

    const mockPlansService = {
        checkPermission: jest.fn(),
        getDetails: jest.fn(),
    };

    const mockPlanEntity: Partial<Plan> = {
        id: 1,
        name: 'Test Plan',
        date: new Date('2025-07-26'),
        startHour: '18:00',
        location: 'Seoul',
        attendees: [],
        memo: 'test',
        writers: [],
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            controllers: [PlansController],
            providers: [
                {
                    provide: PlansService,
                    useValue: mockPlansService,
                },
                {
                    provide: PlansGateway,
                    useValue: {},
                },
            ],
        }).compile();

        controller = module.get<PlansController>(PlansController);
        service = module.get<PlansService>(PlansService);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    // 권한 O, 정상 반환
    it('should return PlanDetails when user has permission', async () => {
        const mockPlanDetails = PlanDetails.from(mockPlanEntity as any);
        mockPlansService.checkPermission.mockResolvedValue(true);
        mockPlansService.getDetails.mockResolvedValue(mockPlanDetails);

        const result = await controller.getDetails(1, 10);

        expect(mockPlansService.checkPermission).toHaveBeenCalledWith(10, 1);
        expect(mockPlansService.getDetails).toHaveBeenCalledWith(1);
        expect(result).toBe(mockPlanDetails);
    });

    // 권한 X, 예외 반환
    it('should throw ProjectForbiddenException when user has no permission', async () => {
        mockPlansService.checkPermission.mockResolvedValue(false);

        await expect(controller.getDetails(1, 10)).rejects.toThrow(ProjectForbiddenException);
        expect(mockPlansService.checkPermission).toHaveBeenCalledWith(10, 1);
        expect(mockPlansService.getDetails).not.toHaveBeenCalled();
    });
});
