import { HttpStatus } from "@nestjs/common";
import { CustomHttpException } from "./custom.exception";
import { ErrorCode } from "./errorcode.enum";

//400
export class BadRequestException extends CustomHttpException{
    constructor(data?: any){
        super(
            ErrorCode.BAD_REQUEST,
            '잘못된 REQUEST입니다.',
            HttpStatus.BAD_REQUEST,
            data,
        );
    }
}

export class InvalidInvitecodeException extends CustomHttpException{
    constructor(data?: any){
        super(
            ErrorCode.INVALID_INVITE_CODE,
            '유효하지 않은 초대코드입니다.',
            HttpStatus.BAD_REQUEST,
            data,
        );
    }
}

//401
export class UnAuthorizedException extends CustomHttpException{
    constructor(data?: any){
        super(
            ErrorCode.UNAUTHORIZED,
            '유효하지 않은 사용자입니다.',
            HttpStatus.UNAUTHORIZED,
            data,
        );
    }
}

//403
export class ProjectForbiddenException extends CustomHttpException{
    constructor(data?: any){
        super(
            ErrorCode.FORBIDDEN_USER_FOR_PROJECT,
            '해당 프로젝트에 접근 권한이 없습니다.',
            HttpStatus.FORBIDDEN,
            data,
        );
    }
}
export class ProjectUpdateForbiddenException extends CustomHttpException{
    constructor(data?: any){
        super(
            ErrorCode.FORBIDDEN_USER_FOR_UPDATE,
            '해당 항목을 수정할 권한이 없습니다.',
            HttpStatus.FORBIDDEN,
            data,
        );
    }
}

//404
export class ProjectNotFoundException extends CustomHttpException{
    constructor(data?: any){
        super(
            ErrorCode.PROJECT_NOT_FOUND,
            '프로젝트를 찾을 수 없습니다.',
            HttpStatus.NOT_FOUND,
            data,
        );
    }
}

export class TaskNotFoundException extends CustomHttpException{
    constructor(data?: any){
        super(
            ErrorCode.TASK_NOT_FOUND,
            'TASK를 찾을 수 없습니다.',
            HttpStatus.NOT_FOUND,
            data,
        );
    }
}

export class StepNotFoundException extends CustomHttpException{
    constructor(data?: any){
        super(
            ErrorCode.STEP_NOT_FOUND,
            'STEP을 찾을 수 없습니다.',
            HttpStatus.NOT_FOUND,
            data,
        );
    }
}

//500
export class InternalServerError extends CustomHttpException{
    constructor(data?: any){
        super(
            ErrorCode.INTERNAL_SERVER_ERROR,
            '서버 내부 에러가 발생했습니다.',
            HttpStatus.INTERNAL_SERVER_ERROR,
            data,
        );
    }
}

export class UserInvariantViolationException extends CustomHttpException{
    constructor(data?: any){
        super(
            ErrorCode.USER_INVARIANT_VIOLATION,
            'userId는 null일 수 없습니다.',
            HttpStatus.INTERNAL_SERVER_ERROR,
            data,
        );
    }
}