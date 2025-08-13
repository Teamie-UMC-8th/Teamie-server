import { Test, TestingModule } from '@nestjs/testing';
import { EventEmitter2, EventEmitterModule } from '@nestjs/event-emitter';
import { EventPayloadDto } from 'src/common/dtos/event-payload.dto';
import { TasksListener } from './tasks.listener';
import { RealTimeEntity, RealTimeType } from 'src/common/response/real-time-response.dto';
import { AppGateway } from 'src/infra/gateway/app.gateway';
import { SubEventType } from 'src/common/enums/sub-event-type.enum';

describe('TasksListener', () => {
    let listener: TasksListener;
    let eventEmitter: EventEmitter2;

    const mockGateway = {
        handlePublish: jest.fn(),
        server: {
            to: jest.fn().mockReturnThis(),
            emit: jest.fn(),
        },
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            imports: [
                EventEmitterModule.forRoot({
                    wildcard: true,
                    delimiter: '.',
                }),
            ],
            providers: [TasksListener, { provide: AppGateway, useValue: mockGateway }],
        }).compile();

        listener = module.get<TasksListener>(TasksListener);
        eventEmitter = module.get<EventEmitter2>(EventEmitter2);

        jest.clearAllMocks();
    });

    it('listener & eventEmitter should be defined', () => {
        expect(listener).toBeDefined();
        expect(eventEmitter).toBeDefined();
    });

    describe('이벤트 pub에 대한 리스너 동작', () => {
        it('task.created → 프로젝트 대시보드 1곳 브로드캐스트', async () => {
            // Arrange
            const projectId = 10;
            const payload: EventPayloadDto = EventPayloadDto.from(RealTimeType.CREATED, {
                projectId,
                task: {
                    id: 77,
                    name: '새 업무',
                    status: 'NOTSTART',
                    deadline: null,
                    stepId: 3,
                    managers: [{ id: 2, name: 'Alice' }],
                },
            });

            // Act
            await eventEmitter.emitAsync(`${RealTimeEntity.TASK}.${payload.type}`, payload);
            await new Promise((r) => setImmediate(r));

            // Assert
            expect(mockGateway.handlePublish).toHaveBeenCalledTimes(1);
            expect(mockGateway.handlePublish).toHaveBeenCalledWith(
                `${SubEventType.PROJECT_DASHBOARD}:${projectId}`,
                expect.objectContaining(payload.data.task)
            );
        });

        it('task.updated → 대시보드 + 상세 2곳 브로드캐스트', async () => {
            // Arrange
            const projectId = 11;
            const taskId = 88;
            const payload: EventPayloadDto = EventPayloadDto.from(RealTimeType.UPDATED, {
                projectId,
                taskId,
                diff: { name: '이름수정', status: 'ONGOING' },
            });

            // Act
            await eventEmitter.emitAsync(`${RealTimeEntity.TASK}.${payload.type}`, payload);
            await new Promise((r) => setImmediate(r));

            // Assert
            expect(mockGateway.handlePublish).toHaveBeenCalledTimes(2);
            expect(mockGateway.handlePublish).toHaveBeenCalledWith(
                `${SubEventType.PROJECT_DASHBOARD}:${projectId}`,
                expect.objectContaining({
                    payload: expect.objectContaining({
                        id: taskId,
                        ...payload.data.diff,
                    }),
                })
            );
            expect(mockGateway.handlePublish).toHaveBeenCalledWith(
                `${SubEventType.TASK_DETAIL}:${taskId}`,
                expect.objectContaining({
                    payload: expect.objectContaining({
                        id: taskId,
                        ...payload.data.diff,
                    }),
                })
            );
        });

        it('task.deleted → 대시보드 + 상세 브로드캐스트 + 상세 forceLeave', async () => {
            // Arrange
            const projectId = 12;
            const taskId = 99;
            const payload: EventPayloadDto = EventPayloadDto.from(RealTimeType.DELETED, {
                projectId,
                taskId,
            });

            // Act
            await eventEmitter.emitAsync(`${RealTimeEntity.TASK}.${payload.type}`, payload);
            await new Promise((r) => setImmediate(r));

            // Assert: 브로드캐스트 2회
            expect(mockGateway.handlePublish).toHaveBeenCalledTimes(2);
            expect(mockGateway.handlePublish).toHaveBeenCalledWith(
                `${SubEventType.PROJECT_DASHBOARD}:${projectId}`,
                expect.objectContaining({
                    payload: payload.data.taskId,
                })
            );
            expect(mockGateway.handlePublish).toHaveBeenCalledWith(
                `${SubEventType.TASK_DETAIL}:${taskId}`,
                expect.objectContaining({
                    payload: payload.data.projectId,
                })
            );

            // Assert: forceLeave 호출
            const detailRoom = `${SubEventType.TASK_DETAIL}:${taskId}`;
            expect(mockGateway.server.to).toHaveBeenCalledWith(detailRoom);
            expect(mockGateway.server.emit).toHaveBeenCalledWith('forceLeave', {
                room: detailRoom,
            });
        });
    });
});
