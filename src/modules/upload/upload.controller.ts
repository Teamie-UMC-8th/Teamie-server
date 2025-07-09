import {
  Controller,
  Get,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { UploadService } from './upload.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { File as MulterFile } from 'multer';
import { S3Client, ListObjectsV2Command } from '@aws-sdk/client-s3';

@Controller('upload')
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  @Post()
  @UseInterceptors(FileInterceptor('file'))
  async upload(@UploadedFile() file: MulterFile) {
    const key = await this.uploadService.uploadFile(file);
    return {
      url: `https://${process.env.AWS_S3_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`,
    };
  }
}

@Controller('s3')
export class S3TestController {
  private readonly s3 = new S3Client({
    region: process.env.AWS_REGION,
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
    },
  });

  @Get('test')
  async testS3() {
    try {
      const result = await this.s3.send(
        new ListObjectsV2Command({
          Bucket: process.env.AWS_S3_BUCKET!,
          MaxKeys: 1,
        }),
      );

      return {
        success: true,
        message: 'S3 연결 성공 ✅',
        result,
      };
    } catch (error: any) {
      console.error('S3 연결 실패 ❌', error);
      return {
        success: false,
        message: 'S3 연결 실패 ❌',
        error: error.message,
      };
    }
  }
}