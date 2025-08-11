import { Test, TestingModule } from '@nestjs/testing';
import { PlansService } from './plans.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ProjectsService } from '../../projects/services/projects.service';
import { Repository } from 'typeorm';
import { Plan } from '../entities/plan.entity';
import { PlanDetails } from '../dtos/plan-details.dto';
import { PlanNotFoundException } from 'src/common/exceptions/custom.errors';

describe('PlansService', () => {
    let service: PlansService;
    let plansRepository: jest.Mocked<Repository<Plan>>;
    let projectsService: { assertProjectMembership: jest.Mock };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                PlansService,
                {
                    provide: getRepositoryToken(Plan),
                    useValue: {
                        createQueryBuilder: jest.fn(),
                        findOne: jest.fn(),
                    },
                },
                {
                    provide: ProjectsService,
                    useValue: {
                        assertProjectMembership: jest.fn(),
                    },
                },
            ],
        }).compile();

        service = module.get<PlansService>(PlansService);
        plansRepository = module.get(getRepositoryToken(Plan));
        projectsService = module.get(ProjectsService);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    // getDetails - 정상 동작
    it('should return plan details when plan exists', async () => {
        const mockPlan = { id: 1 } as Plan;
        const queryBuilder: any = {
            leftJoinAndSelect: jest.fn().mockReturnThis(),
            where: jest.fn().mockReturnThis(),
            getOne: jest.fn().mockResolvedValue(mockPlan),
        };
        plansRepository.createQueryBuilder.mockReturnValue(queryBuilder);

        jest.spyOn(PlanDetails, 'from').mockReturnValue({} as PlanDetails);

        const result = await service.getDetails(1);

        expect(result).toEqual(expect.any(Object));
        expect(queryBuilder.getOne).toHaveBeenCalled();
    });

    // getDetails - 존재하지 않으면 예외
    it('should throw PlanNotFoundException if plan not found', async () => {
        const queryBuilder: any = {
            leftJoinAndSelect: jest.fn().mockReturnThis(),
            where: jest.fn().mockReturnThis(),
            getOne: jest.fn().mockResolvedValue(null),
        };
        plansRepository.createQueryBuilder.mockReturnValue(queryBuilder);

        await expect(service.getDetails(1)).rejects.toThrow(PlanNotFoundException);
    });

    // checkPermission - 권한 있음
    it('should return true when user is a project member', async () => {
        const mockPlan = {
            id: 1,
            project: { id: 999 },
        } as Plan;

        (plansRepository.findOne as jest.Mock).mockResolvedValue(mockPlan);
        projectsService.assertProjectMembership.mockResolvedValue(true);

        const result = await service.checkPermission(10, 1);

        expect(result).toBe(true);
        expect(projectsService.assertProjectMembership).toHaveBeenCalledWith(10, 999);
    });

    // checkPermission - plan 없으면 예외
    it('should throw PlanNotFoundException if plan does not exist', async () => {
        (plansRepository.findOne as jest.Mock).mockResolvedValue(null);

        await expect(service.checkPermission(10, 1)).rejects.toThrow(PlanNotFoundException);
    });

    // checkPermission - 권한 없음
    it('should return false when user is not a project member', async () => {
        const mockPlan = {
            id: 1,
            project: { id: 999 },
        } as Plan;

        (plansRepository.findOne as jest.Mock).mockResolvedValue(mockPlan);
        projectsService.assertProjectMembership.mockResolvedValue(false);

        const result = await service.checkPermission(10, 1);
        expect(result).toBe(false);
    });
});
