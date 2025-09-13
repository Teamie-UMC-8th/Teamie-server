import { FailToSerializeException } from '../exceptions/custom.errors';

export const CursorUtil = {
    encode<T extends object>(cursorObj: T): string {
        const jsonString = JSON.stringify(cursorObj);
        return Buffer.from(jsonString, 'utf-8').toString('base64');
    },

    decode<T>(cursor: string): T {
        try {
            const decodedCursor = Buffer.from(cursor, 'base64').toString('utf-8');
            return JSON.parse(decodedCursor) as T;
        } catch (err) {
            throw new FailToSerializeException();
        }
    },
};
