export class ErrorPayload {
    errorCode: string;
    reason: string;
    data? : any;
}

export class CommonResponse<T=any> {
    isSuccess: boolean;
    error: ErrorPayload | null;
    result: T | null;

    private constructor(isSuccess: boolean, error: ErrorPayload | null, result: T | null){
        this.isSuccess = isSuccess;
        this.error = error;
        this.result = result;
    }

    static success<T>(data: T): CommonResponse<T> {
        return new CommonResponse(true, null, data);
    }

    static fail(errorCode: string, reason: string, data?: any): CommonResponse<null> {
        return new CommonResponse(false, { errorCode, reason, data }, null);
    }
}