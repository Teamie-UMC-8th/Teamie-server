import { Injectable } from '@nestjs/common';
import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { v4 as uuid } from 'uuid';

@Injectable()
export class UploadService {
    private s3 = new S3Client({
        region: process.env.AWS_REGION,
        credentials: {
            accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
            secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
        },
    });

    async uploadFile(file: Express.Multer.File): Promise<string> {
        const bucket = process.env.AWS_S3_BUCKET!;
        const region = process.env.AWS_REGION!;
        const key = `upload/${uuid()}-${file.originalname}`;

        const command = new PutObjectCommand({
            Bucket: bucket,
            Key: key,
            Body: file.buffer,
        });

        await this.s3.send(command);

        // bucket, region 변수가 메서드 내에 선언되어 있으므로 에러가 사라집니다.
        return `https://${bucket}.s3.${region}.amazonaws.com/${key}`;
    }

    async deleteFile(key: string): Promise<void> {
        const command = new DeleteObjectCommand({
            Bucket: process.env.AWS_S3_BUCKET!,
            Key: key,
        });

        await this.s3.send(command);
    }
}
