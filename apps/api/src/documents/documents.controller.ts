import { promises as fsp } from 'fs';
import * as path from 'path';
import { randomUUID } from 'crypto';
import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  Res,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import type { Request, Response } from 'express';
import { ApiBearerAuth, ApiConsumes, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import {
  ALLOWED_MIME_TYPES,
  DocumentsService,
  MAX_UPLOAD_BYTES,
} from './documents.service';
import { UploadDocumentDto } from './dto/upload-document.dto';
import { QueryDocumentDto } from './dto/query-document.dto';

const UPLOAD_ROOT = process.env.UPLOAD_DIR ?? './uploads';

/** Multer disk storage: files land in `<UPLOAD_ROOT>/<caseId>/<uuid><ext>`. */
const storage = diskStorage({
  destination: (req: Request, _file, cb) => {
    const caseId = (req.params as Record<string, string>)?.caseId ?? 'misc';
    const dir = path.join(UPLOAD_ROOT, caseId);
    fsp
      .mkdir(dir, { recursive: true })
      .then(() => cb(null, dir))
      .catch((err) => cb(err as Error, dir));
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${randomUUID()}${ext}`);
  },
});

const fileFilter = (
  _req: Request,
  file: Express.Multer.File,
  cb: (error: Error | null, acceptFile: boolean) => void,
) => {
  if (!ALLOWED_MIME_TYPES.has(file.mimetype)) {
    cb(new BadRequestException(`Unsupported file type: ${file.mimetype}`), false);
    return;
  }
  cb(null, true);
};

@ApiTags('documents')
@ApiBearerAuth()
@Controller()
export class DocumentsController {
  constructor(private readonly documents: DocumentsService) {}

  @Roles(Role.ADVOCATE, Role.JUNIOR_ADVOCATE, Role.OFFICE_STAFF)
  @ApiConsumes('multipart/form-data')
  @Post('cases/:caseId/documents')
  @UseInterceptors(
    FileInterceptor('file', {
      storage,
      fileFilter,
      limits: { fileSize: MAX_UPLOAD_BYTES },
    }),
  )
  upload(
    @Param('caseId') caseId: string,
    @UploadedFile() file: Express.Multer.File,
    @Body() dto: UploadDocumentDto,
    @CurrentUser('id') actorId: string,
  ) {
    return this.documents.upload(caseId, file, dto, actorId);
  }

  @Get('cases/:caseId/documents')
  findAll(@Param('caseId') caseId: string, @Query() dto: QueryDocumentDto) {
    return this.documents.findAll(caseId, dto);
  }

  @Get('documents/:id')
  findOne(@Param('id') id: string) {
    return this.documents.findOne(id);
  }

  @Get('documents/:id/download')
  async download(
    @Param('id') id: string,
    @CurrentUser('id') actorId: string,
    @Res({ passthrough: false }) res: Response,
  ) {
    const { doc, stream } = await this.documents.getDownload(id, actorId);
    res.setHeader('Content-Type', doc.mimeType);
    res.setHeader('Content-Length', String(doc.sizeBytes));
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${encodeURIComponent(doc.fileName)}"`,
    );
    stream.on('error', () => {
      if (!res.headersSent) res.status(500);
      res.end();
    });
    stream.pipe(res);
  }

  @Roles(Role.ADVOCATE, Role.JUNIOR_ADVOCATE, Role.OFFICE_STAFF)
  @Delete('documents/:id')
  remove(@Param('id') id: string, @CurrentUser('id') actorId: string) {
    return this.documents.remove(id, actorId);
  }
}
