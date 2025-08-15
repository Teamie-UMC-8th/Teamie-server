import { Injectable } from '@nestjs/common';
import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { v4 as uuid } from 'uuid';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class UploadService {
    private readonly s3: S3Client;

    constructor(private readonly configService: ConfigService) {
        this.s3 = new S3Client({
            region: this.configService.get<string>('AWS_REGION'),
            credentials: {
                accessKeyId: this.configService.get<string>('AWS_ACCESS_KEY_ID')!,
                secretAccessKey: this.configService.get<string>('AWS_SECRET_ACCESS_KEY')!,
            },
        });
    }

    async uploadFile(file: Express.Multer.File): Promise<string> {
        const bucket = this.configService.get<string>('AWS_S3_BUCKET')!;
        const region = this.configService.get<string>('AWS_REGION')!;
        const key = `upload/${uuid()}-${file.originalname}`;

        const command = new PutObjectCommand({
            Bucket: bucket,
            Key: key,
            Body: file.buffer,
            ContentType: file.mimetype,
            ContentDisposition: 'inline',
        });
        await this.s3.send(command);

        return `https://${bucket}.s3.${region}.amazonaws.com/${key}`;
    }

    async deleteFile(key: string): Promise<void> {
        const bucket = this.configService.get<string>('AWS_S3_BUCKET')!;
        const command = new DeleteObjectCommand({ Bucket: bucket, Key: key });
        await this.s3.send(command);
    }
}
