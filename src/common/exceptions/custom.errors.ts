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

//401
export class UnAuthorizedException extends CustomHttpException {
    constructor(data?: any) {
        super(ErrorCode.UNAUTHORIZED, '유효하지 않은 사용자입니다.', HttpStatus.UNAUTHORIZED, data);
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
