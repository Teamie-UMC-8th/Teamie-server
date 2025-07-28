import { registerDecorator, ValidationOptions, ValidationArguments } from 'class-validator';

export function IsISODateString(validationOptions?: ValidationOptions) {
    return function (object: Object, propertyName: string) {
        registerDecorator({
            name: 'isISODateString',
            target: object.constructor,
            propertyName: propertyName,
            options: validationOptions,
            validator: {
                validate(value: any, _args: ValidationArguments) {
                    return (
                        typeof value === 'string' &&
                        !isNaN(Date.parse(value)) &&
                        value === new Date(value).toISOString()
                    );
                },
                defaultMessage(args: ValidationArguments) {
                    return `${args.property}는 ISO 8601 형식의 문자열이어야 합니다.`;
                },
            },
        });
    };
}
