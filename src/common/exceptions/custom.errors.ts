import { HttpStatus } from '@nestjs/common';
import { CustomHttpException } from './custom.exception';
import { ErrorCode } from './errorcode.enum';

//400
export class BadRequestException extends CustomHttpException {
    constructor(data?: any) {
        super(ErrorCode.BAD_REQUEST, '잘못된 REQUEST입니다.', HttpStatus.BAD_REQUEST, data);
    }
}

export class InvalidInvitecodeException extends CustomHttpException {
    constructor(data?: any) {
        super(
            ErrorCode.INVALID_INVITE_CODE,
            '유효하지 않은 초대코드입니다.',
            HttpStatus.BAD_REQUEST,
            data
        );
    }
}

export class InvalidDateException extends CustomHttpException {
    constructor(data?: any) {
        super(
            ErrorCode.PLAN_DATE_TOO_LONG,
            '최대 31일까지만 조회할 수 있습니다.',
            HttpStatus.BAD_REQUEST,
            data
        );
    }
}

export class TaskFileLimitExceededException extends CustomHttpException {
    constructor(data?: any) {
        super(
            ErrorCode.TASK_FILE_LIMIT_EXCEEDED,
            '업무에는 최대 3개의 파일만 업로드할 수 있습니다.',
            HttpStatus.BAD_REQUEST,
            data
        );
    }
}

export class APIBadRequestException extends CustomHttpException {
    constructor(data?: any) {
        super(ErrorCode.API_BAD_REQUEST, '잘못된 요청입니다.', HttpStatus.BAD_REQUEST, data);
    }
}

export class APIPaymentRequiredException extends CustomHttpException {
    constructor(data?: any) {
        super(
            ErrorCode.API_PAYMENT_REQUIRED,
            'API 크레딧이 부족합니다. 충전 후 다시 시도하세요.',
            HttpStatus.PAYMENT_REQUIRED,
            data
        );
    }
}

export class APITimeoutException extends CustomHttpException {
    constructor(data?: any) {
        super(
            ErrorCode.API_TIMEOUT,
            '요청 시간이 초과되었습니다. 잠시 후 다시 시도하세요.',
            HttpStatus.REQUEST_TIMEOUT,
            data
        );
    }
}

export class APITooManyRequestsException extends CustomHttpException {
    constructor(data?: any) {
        super(
            ErrorCode.API_TOO_MANY_REQUESTS,
            '요청이 너무 많아 제한되었습니다. 잠시 후 다시 시도하세요.',
            HttpStatus.TOO_MANY_REQUESTS,
            data
        );
    }
}

export class QuestionUpdateException extends CustomHttpException {
    constructor(message: string, data?: any) {
        super(
            ErrorCode.QUESTION_UPDATE_ERROR,
            `질문 업데이트에 실패했습니다. 문제: ${message}`,
            HttpStatus.BAD_REQUEST,
            data
        );
    }
}

export class ProjectNotSelectedException extends CustomHttpException {
    constructor(data?: any) {
        super(
            ErrorCode.NEED_PROJECT_SELECTED,
            '프로젝트를 선택해야 합니다.',
            HttpStatus.BAD_REQUEST,
            data
        );
    }
}

export class ProjectMaxSelectedException extends CustomHttpException {
    constructor(data?: any) {
        super(
            ErrorCode.PROJECT_MAX_SELECTED,
            `프로젝트는 최대 ${process.env.MAX_SELECTED_PROJECTS || '6'}개까지 선택할 수 있습니다.`,
            HttpStatus.BAD_REQUEST,
            data
        );
    }
}

//401
export class UnAuthorizedException extends CustomHttpException {
    constructor(data?: any) {
        super(ErrorCode.UNAUTHORIZED, '유효하지 않은 사용자입니다.', HttpStatus.UNAUTHORIZED, data);
    }
}

export class LogoutUserException extends CustomHttpException {
    constructor(data?: any) {
        super(ErrorCode.LOGOUT_USER, '로그아웃한 사용자입니다.', HttpStatus.UNAUTHORIZED, data);
    }
}

export class APIUnauthorizedException extends CustomHttpException {
    constructor(data?: any) {
        super(
            ErrorCode.API_UNAUTHORIZED,
            'API 인증에 실패했습니다. API 키를 확인하세요.',
            HttpStatus.UNAUTHORIZED,
            data
        );
    }
}

//403
export class ProjectForbiddenException extends CustomHttpException {
    constructor(data?: any) {
        super(
            ErrorCode.FORBIDDEN_USER_FOR_PROJECT,
            '해당 프로젝트에 접근 권한이 없습니다.',
            HttpStatus.FORBIDDEN,
            data
        );
    }
}
export class ProjectUpdateForbiddenException extends CustomHttpException {
    constructor(data?: any) {
        super(
            ErrorCode.FORBIDDEN_USER_FOR_UPDATE,
            '해당 항목을 수정할 권한이 없습니다.',
            HttpStatus.FORBIDDEN,
            data
        );
    }
}
export class CommentUpdateForbiddenException extends CustomHttpException {
    constructor(data?: any) {
        super(
            ErrorCode.FORBIDDEN_COMMENT_FOR_UPDATE,
            '해당 항목을 수정할 권한이 없습니다.',
            HttpStatus.FORBIDDEN,
            data
        );
    }
}

export class CommentDeleteForbiddenException extends CustomHttpException {
    constructor(data?: any) {
        super(
            ErrorCode.FORBIDDEN_COMMENT_FOR_DELETE,
            '본인이 작성한 댓글만 삭제할 수 있습니다.',
            HttpStatus.FORBIDDEN,
            data
        );
    }
}

export class CocommentUpdateForbiddenException extends CustomHttpException {
    constructor(data?: any) {
        super(
            ErrorCode.FORBIDDEN_COCOMMENT_FOR_UPDATE,
            '본인이 작성한 대댓글만 수정할 수 있습니다.',
            HttpStatus.FORBIDDEN,
            data
        );
    }
}

export class CocommentDeleteForbiddenException extends CustomHttpException {
    constructor(data?: any) {
        super(
            ErrorCode.FORBIDDEN_COCOMMENT_FOR_DELETE,
            '본인이 작성한 대댓글만 삭제할 수 있습니다.',
            HttpStatus.FORBIDDEN,
            data
        );
    }
}

export class AlreadyProjectCompletedException extends CustomHttpException {
    constructor(data?: any) {
        super(
            ErrorCode.PROJECT_ALREADY_COMPLETED,
            '이미 완료된 프로젝트입니다.',
            HttpStatus.FORBIDDEN,
            data
        );
    }
}

export class ExpiredInvitecodeException extends CustomHttpException {
    constructor(data?: any) {
        super(
            ErrorCode.EXPIRED_INVITE_CODE,
            '유효기간이 지난 url입니다.',
            HttpStatus.FORBIDDEN,
            data
        );
    }
}

export class NotPostAuthorException extends CustomHttpException {
    constructor(data?: any) {
        super(
            ErrorCode.NOT_POST_AUTHOR,
            '포스트잇 작성자만 삭제할 수 있습니다.',
            HttpStatus.FORBIDDEN,
            data
        );
    }
}

export class ForbiddenSelfAssignException extends CustomHttpException {
    constructor(data?: any) {
        super(
            ErrorCode.FORBIDDEN_SELF_ASSIGN,
            '자기 자신을 팀장으로 지목할 수 없습니다.',
            HttpStatus.FORBIDDEN,
            data
        );
    }
}

export class StepDeleteForBiddenException extends CustomHttpException {
    constructor(data?: any) {
        super(
            ErrorCode.STEP_DELETE_FORBIDDEN,
            'STEP 내부에 업무가 존재할 경우, 삭제가 불가능합니다',
            HttpStatus.FORBIDDEN,
            data
        );
    }
}

export class ProfileForbiddenException extends CustomHttpException {
    constructor(data?: any) {
        super(
            ErrorCode.NOT_YOUR_PROFILE,
            '자신의 프로필만 수정할 수 있습니다.',
            HttpStatus.FORBIDDEN,
            data
        );
    }
}

export class ForbiddenUserForMasterPortfolioException extends CustomHttpException {
    constructor(data?: any) {
        super(
            ErrorCode.FORBIDDEN_USER_FOR_MASTER_PORTFOLIO,
            '마스터포트폴리오 카드에 대해 수정권한이 없는 사용자입니다.',
            HttpStatus.FORBIDDEN,
            data
        );
    }
}

export class APIForbiddenException extends CustomHttpException {
    constructor(data?: any) {
        super(
            ErrorCode.API_FORBIDDEN,
            '입력이 정책에 의해 차단되었습니다.',
            HttpStatus.FORBIDDEN,
            data
        );
    }
}

//404
export class ProjectNotFoundException extends CustomHttpException {
    constructor(data?: any) {
        super(
            ErrorCode.PROJECT_NOT_FOUND,
            '프로젝트를 찾을 수 없습니다.',
            HttpStatus.NOT_FOUND,
            data
        );
    }
}

export class ProjectLeaderNotFoundException extends CustomHttpException {
    constructor(projectId: number) {
        super(
            ErrorCode.NOT_FOUND_LEADER,
            '프로젝트 리더를 찾을 수 없습니다.',
            HttpStatus.NOT_FOUND,
            { projectId }
        );
    }
}

export class PostNotFoundException extends CustomHttpException {
    constructor(data?: any) {
        super(ErrorCode.POST_NOT_FOUND, '포스트잇을 찾을 수 없습니다.', HttpStatus.NOT_FOUND, data);
    }
}

export class TaskNotFoundException extends CustomHttpException {
    constructor(data?: any) {
        super(ErrorCode.TASK_NOT_FOUND, 'TASK를 찾을 수 없습니다.', HttpStatus.NOT_FOUND, data);
    }
}

export class StepNotFoundException extends CustomHttpException {
    constructor(data?: any) {
        super(ErrorCode.STEP_NOT_FOUND, 'STEP을 찾을 수 없습니다.', HttpStatus.NOT_FOUND, data);
    }
}

export class PlanNotFoundException extends CustomHttpException {
    constructor(data?: any) {
        super(ErrorCode.PLAN_NOT_FOUND, 'PLAN을 찾을 수 없습니다.', HttpStatus.NOT_FOUND, data);
    }
}

export class PersonalRecallNotFoundException extends CustomHttpException {
    constructor(data?: any) {
        super(
            ErrorCode.PERSONAL_RECALL_NOT_FOUND,
            '개인 회고를 찾을 수 없습니다.',
            HttpStatus.NOT_FOUND,
            data
        );
    }
}

export class ProjectTransactionException extends CustomHttpException {
    constructor(data?: any) {
        super(
            ErrorCode.PROJECT_TRANSACTION_ERROR,
            '프로젝트 관련 트랜잭션에서 에러가 발생했습니다.',
            HttpStatus.INTERNAL_SERVER_ERROR,
            data
        );
    }
}
export class MasterPortfolioNotFoundException extends CustomHttpException {
    constructor(data?: any) {
        super(
            ErrorCode.MASTER_PORTFOLIO_NOT_FOUND,
            '마스터 포트폴리오를 찾을 수 없습니다.',
            HttpStatus.NOT_FOUND,
            data
        );
    }
}

export class MasterPortfolioAINotFoundException extends CustomHttpException {
    constructor(data?: any) {
        super(
            ErrorCode.MASTER_PORTFOLIO_AI_NOT_FOUND,
            '마스터 포트폴리오 AI 생성 결과를 찾을 수 없습니다.',
            HttpStatus.NOT_FOUND,
            data
        );
    }
}

export class TaskFileNotFoundException extends CustomHttpException {
    constructor(data?: any) {
        super(
            ErrorCode.TASK_FILE_NOT_FOUND,
            '업무파일을 찾을 수 없습니다.',
            HttpStatus.NOT_FOUND,
            data
        );
    }
}

export class CommentNotFoundException extends CustomHttpException {
    constructor(data?: any) {
        super(ErrorCode.COMMENT_NOT_FOUND, '댓글을 찾을 수 없습니다.', HttpStatus.NOT_FOUND, data);
    }
}

export class CocommentNotFoundException extends CustomHttpException {
    constructor(data?: any) {
        super(
            ErrorCode.COCOMMENT_NOT_FOUND,
            '대댓글을 찾을 수 없습니다.',
            HttpStatus.NOT_FOUND,
            data
        );
    }
}

export class ProjectPortfolioCorrectionNotFoundException extends CustomHttpException {
    constructor(id: number, data?: any) {
        super(
            ErrorCode.CORRECTION_NOT_FOUND,
            `해당 프로젝트는 첨삭 ID ${id}에 해당하는 AI 첨삭 결과가 존재하지 않습니다.`,
            HttpStatus.NOT_FOUND,
            data
        );
    }
}

export class PortfolioCorrectionNotFoundException extends CustomHttpException {
    constructor(id: number, data?: any) {
        super(
            ErrorCode.CORRECTION_NOT_FOUND,
            `correction ID ${id}에 대한 포트폴리오 첨삭 데이터를 찾을 수 없습니다.`,
            HttpStatus.NOT_FOUND,
            data
        );
    }
}

export class AICorrectionNotFoundException extends CustomHttpException {
    constructor(id: number, data?: any) {
        super(
            ErrorCode.AI_CORRECTION_NOT_FOUND,
            `correction ID ${id}에 대한 AI 첨삭 결과가 존재하지 않습니다.`,
            HttpStatus.NOT_FOUND,
            data
        );
    }
}

export class QuestionNotFoundException extends CustomHttpException {
    constructor(message: string, data?: any) {
        super(
            ErrorCode.QUESTION_NOT_FOUND,
            `질문을 찾을 수 없습니다. 문제: ${message}`,
            HttpStatus.NOT_FOUND,
            data
        );
    }
}

//409
export class PostsExceededException extends CustomHttpException {
    constructor(data?: any) {
        super(
            ErrorCode.POSTS_EXCEEDED,
            '포스트잇은 10개까지 생성될 수 있습니다.',
            HttpStatus.CONFLICT,
            data
        );
    }
}

export class UserNotFoundException extends CustomHttpException {
    constructor(data?: any) {
        super(ErrorCode.USER_NOT_FOUND, '사용자를 찾을 수 없습니다.', HttpStatus.NOT_FOUND, data);
    }
}

export class AlreadyLeaderException extends CustomHttpException {
    constructor(data?: any) {
        super(ErrorCode.ALREDY_LEADER, '이미 팀장인 사용자입니다.', HttpStatus.CONFLICT, data);
    }
}

export class AssigneeNotMemberException extends CustomHttpException {
    constructor(data?: any) {
        super(
            ErrorCode.ASSIGNEE_NOT_MEMBER,
            '해당 사람은 프로젝트 멤버가 아닙니다.',
            HttpStatus.FORBIDDEN,
            data
        );
    }
}

export class AlreadyJoinException extends CustomHttpException {
    constructor(projectId: number) {
        super(ErrorCode.ALREDY_JOIN, '이미 프로젝트에 참여하였습니다.', HttpStatus.FORBIDDEN, {
            projectId,
        });
    }
}
export class MasterPortfolioDuplicateException extends CustomHttpException {
    constructor(userId: number, projectId: number, data?: any) {
        super(
            ErrorCode.MASTER_PORTFOLIO_DUPLICATE,
            `유저 ID ${userId}는 이미 프로젝트 ID ${projectId}에 대한 마스터 포트폴리오가 존재합니다.`,
            HttpStatus.CONFLICT,
            data
        );
    }
}

export class PlanDateConflictException extends CustomHttpException {
    constructor(data?: any) {
        super(
            ErrorCode.PLAN_DATE_CONFLICT,
            '프로젝트 생성일자 이전에는 일정 생성이 불가능합니다.',
            HttpStatus.FORBIDDEN,
            data
        );
    }
}

export class AIGenerationAlreadyExists extends CustomHttpException {
    constructor(data?: any) {
        super(
            ErrorCode.AI_GENERATION_ALREADY_EXISTS,
            '이미 AI 생성 결과가 존재합니다.',
            HttpStatus.CONFLICT,
            data
        );
    }
}

export class RAGAlreadyExistsException extends CustomHttpException {
    constructor(data?: any) {
        super(
            ErrorCode.RAG_ALREADY_EXISTS,
            '이미 RAG가 진행되었습니다.',
            HttpStatus.CONFLICT,
            data
        );
    }
}

//500
export class InternalServerError extends CustomHttpException {
    constructor(data?: any) {
        super(
            ErrorCode.INTERNAL_SERVER_ERROR,
            '서버 내부 에러가 발생했습니다.',
            HttpStatus.INTERNAL_SERVER_ERROR,
            data
        );
    }
}

export class TransactionException extends CustomHttpException {
    constructor(domain: string, data?: any) {
        super(
            ErrorCode.TRANSACTION_ERROR,
            `${domain}에서 트랜잭션 에러가 발생했습니다.`,
            HttpStatus.INTERNAL_SERVER_ERROR,
            data
        );
    }
}

export class UserInvariantViolationException extends CustomHttpException {
    constructor(data?: any) {
        super(
            ErrorCode.USER_INVARIANT_VIOLATION,
            'userId는 null일 수 없습니다.',
            HttpStatus.INTERNAL_SERVER_ERROR,
            data
        );
    }
}

export class RedisDataParseException extends CustomHttpException {
    constructor(data?: any) {
        super(
            ErrorCode.POST_NOT_PARSED,
            'Redis에서 데이터를 파싱하는 중 오류가 발생했습니다.',
            HttpStatus.INTERNAL_SERVER_ERROR,
            data
        );
    }
}

export class PromptLoadingException extends CustomHttpException {
    constructor(filename: string, data?: any) {
        super(
            ErrorCode.PROMPT_LOADING_ERROR,
            `프롬프트 파일을 로딩할 수 없습니다: ${filename}`,
            HttpStatus.INTERNAL_SERVER_ERROR,
            data
        );
    }
}

export class PlanTransactionException extends CustomHttpException {
    constructor(data?: any) {
        super(
            ErrorCode.PLAN_TRANSACTION_ERROR,
            '일정 관련 트랜잭션에서 에러가 발생했습니다.',
            HttpStatus.INTERNAL_SERVER_ERROR,
            data
        );
    }
}

export class StepTransactionException extends CustomHttpException {
    constructor(data?: any) {
        super(
            ErrorCode.STEP_TRANSACTION_ERROR,
            'STEP 관련 트랜잭션에서 에러가 발생했습니다.',
            HttpStatus.INTERNAL_SERVER_ERROR,
            data
        );
    }
}

export class FailJSONParseException extends CustomHttpException {
    constructor(message: string, data?: any) {
        super(
            ErrorCode.FAIL_JSON_PARSE,
            `JSON 파싱에 실패했습니다. ${message}`,
            HttpStatus.INTERNAL_SERVER_ERROR,
            data
        );
    }
}

export class LLMIncludesEmptyException extends CustomHttpException {
    constructor(data?: any) {
        super(
            ErrorCode.LLM_INCLUDES_EMPTY,
            'LLM 응답에 빈 결과가 포함되어 있습니다.',
            HttpStatus.INTERNAL_SERVER_ERROR,
            data
        );
    }
}

export class MasterPortfolioAIResultNotValidException extends CustomHttpException {
    constructor(data?: any) {
        super(
            ErrorCode.MASTER_PORTFOLIO_AI_RESULT_NOT_VALID,
            '생성된 마스터 포트폴리오 AI 결과의 내용 구조가 유효하지 않습니다.',
            HttpStatus.INTERNAL_SERVER_ERROR,
            data
        );
    }
}

export class LLMGenerateQuestionFailedException extends CustomHttpException {
    constructor(message: string, data?: any) {
        super(
            ErrorCode.LLM_GENERATE_QUESTION_FAILED,
            `LLM이 질문 생성에 실패했습니다. 문제: ${message}`,
            HttpStatus.INTERNAL_SERVER_ERROR,
            data
        );
    }
}

export class LLMUnknownGenerateErrorException extends CustomHttpException {
    constructor(message: string, data?: any) {
        super(
            ErrorCode.LLM_UNKNOWN_GENERATE_ERROR,
            `LLM 생성 중 알 수 없는 오류가 발생했습니다. 문제: ${message}`,
            HttpStatus.INTERNAL_SERVER_ERROR,
            data
        );
    }
}

export class LLMSyntaxErrorException extends CustomHttpException {
    constructor(message: string, data?: any) {
        super(
            ErrorCode.LLM_SYNTAX_ERROR,
            `LLM 생성 결과에 구문 오류가 발생했습니다. 문제: ${message}`,
            HttpStatus.INTERNAL_SERVER_ERROR,
            data
        );
    }
}

export class LLMZodErrorException extends CustomHttpException {
    constructor(message: string, data?: any) {
        super(
            ErrorCode.LLM_ZOD_ERROR,
            `LLM 생성 결과에 대한 Zod 검증 오류가 발생했습니다. 문제: ${message}`,
            HttpStatus.INTERNAL_SERVER_ERROR,
            data
        );
    }
}

export class APIBadGatewayException extends CustomHttpException {
    constructor(data?: any) {
        super(
            ErrorCode.API_BAD_GATEWAY,
            '모델 서버에 문제가 있습니다. 잠시 후 다시 시도하세요.',
            HttpStatus.BAD_GATEWAY,
            data
        );
    }
}

export class APIServiceUnavailableException extends CustomHttpException {
    constructor(data?: any) {
        super(
            ErrorCode.API_SERVICE_UNAVAILABLE,
            '사용 가능한 모델이 없습니다. 잠시 후 다시 시도하세요.',
            HttpStatus.SERVICE_UNAVAILABLE,
            data
        );
    }
}

export class QuestionGenerationException extends CustomHttpException {
    constructor(message: string, data?: any) {
        super(
            ErrorCode.QUESTION_GENERATION_ERROR,
            `질문 생성 중 오류가 발생했습니다. 문제: ${message}`,
            HttpStatus.INTERNAL_SERVER_ERROR,
            data
        );
    }
}

export class InvalidQuestionTypeException extends CustomHttpException {
    constructor(message: string, data?: any) {
        super(
            ErrorCode.INVALID_QUESTION_TYPE,
            `유효하지 않은 질문 타입입니다. 타입: ${message}`,
            HttpStatus.INTERNAL_SERVER_ERROR,
            data
        );
    }
}

export class MasterPortfolioSaveFailException extends CustomHttpException {
    constructor(message: string, data?: any) {
        super(
            ErrorCode.MASTER_PORTFOLIO_SAVE_FAIL,
            `마스터 포트폴리오 AI 생성 결과 저장에 실패했습니다. 문제: ${message}`,
            HttpStatus.INTERNAL_SERVER_ERROR,
            data
        );
    }
}

export class MasterPortfolioAIGenerateFailException extends CustomHttpException {
    constructor(message: string, data?: any) {
        super(
            ErrorCode.MASTER_PORTFOLIO_GENERATE_FAIL,
            `마스터 포트폴리오 AI 생성에 실패했습니다. 문제: ${message}`,
            HttpStatus.INTERNAL_SERVER_ERROR,
            data
        );
    }
}
