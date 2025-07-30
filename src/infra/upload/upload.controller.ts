import { Controller, Get, Post, UploadedFile, UseInterceptors } from '@nestjs/common';
import { UploadService } from './upload.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { S3Client, ListObjectsV2Command } from '@aws-sdk/client-s3';
import { User } from 'src/common/decorators/user.decorator';
import { ConfigService } from '@nestjs/config';
@Controller('upload')
export class UploadController {
    constructor(private readonly uploadService: UploadService) {}

    @Post()
    @UseInterceptors(FileInterceptor('file'))
    async upload(@UploadedFile() file: Express.Multer.File) {
        const url = await this.uploadService.uploadFile(file);
        return {
            url
        };
    }
}

@Controller('s3')
export class S3TestController {
    private readonly s3: S3Client;
    constructor(private readonly config: ConfigService) {
    this.s3 = new S3Client({
      region: this.config.get<string>('AWS_REGION'),
      credentials: {
        accessKeyId: this.config.get<string>('AWS_ACCESS_KEY_ID')!,
        secretAccessKey: this.config.get<string>('AWS_SECRET_ACCESS_KEY')!,
      },
    });
  }
}
