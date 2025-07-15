import { HttpException, HttpStatus } from "@nestjs/common";

export class CustomHttpException extends HttpException {
    constructor(
        errorCode: string,
        reason: string,
        status: number = HttpStatus.INTERNAL_SERVER_ERROR,
        data?: any,
    ){
        super(
            {
                errorCode,
                message: reason,
                data,
            },
            status
        );
    }
}