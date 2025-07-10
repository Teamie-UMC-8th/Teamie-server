import { getSchemaPath, ApiExtraModels, ApiOkResponse, ApiResponse } from '@nestjs/swagger';
import { applyDecorators, Type } from '@nestjs/common';
import { CommonResponse } from 'src/common/response/common-response.dto';

export const ApiCommonResponse = <T extends Type<any>>(model: T) => {
  return applyDecorators(
    ApiExtraModels(CommonResponse, model),
    ApiOkResponse({
      description: '성공 응답',
      schema: {
        allOf: [
          { $ref: getSchemaPath(CommonResponse) },
          {
            properties: {
              isSuccess: { type: 'boolean', example: true },
              error: { type: 'null', example: null },
              result: { $ref: getSchemaPath(model) },
            },
          },
        ],
      },
    }),
  );
};


export const ApiCommonErrorResponse = (
  errorCode: string,
  reason: string,
  status = 401, // 기본값: 인증 실패
) => {
  return applyDecorators(
    ApiResponse({
      status,
      description: reason,
      schema: {
        example: {
          isSuccess: false,
          error: {
            errorCode: errorCode,
            reason: reason,
            data: null,
          },
          result: null,
        },
      },
    }),
  );
};