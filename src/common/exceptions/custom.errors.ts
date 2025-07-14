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