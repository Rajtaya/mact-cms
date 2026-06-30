import { createHash } from 'crypto';
import { createReadStream, promises as fsp } from 'fs';
import * as path from 'path';
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AuditAction, DocumentCategory, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { paginate } from '../common/dto/pagination.dto';
import { UploadDocumentDto } from './dto/upload-document.dto';
import { QueryDocumentDto } from './dto/query-document.dto';

/** Root directory under which per-case subfolders are created. */
const UPLOAD_ROOT = process.env.UPLOAD_DIR ?? './uploads';

/** Whitelisted upload mime types. */
export const ALLOWED_MIME_TYPES = new Set<string>([
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp',
  'video/mp4',
  'application/msword', // .doc
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
  'application/vnd.ms-excel', // .xls
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
]);

export const MAX_UPLOAD_BYTES =
  Number(process.env.MAX_UPLOAD_MB ?? 25) * 1024 * 1024;

@Injectable()
export class DocumentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async upload(
    caseId: string,
    file: Express.Multer.File,
    dto: UploadDocumentDto,
    actorId?: string,
  ) {
    if (!file) throw new BadRequestException('No file provided');

    // Belt-and-braces validation (the interceptor limit is the first line).
    if (file.size > MAX_UPLOAD_BYTES) {
      await this.safeUnlink(file.path);
      throw new BadRequestException(
        `File exceeds the ${Math.round(MAX_UPLOAD_BYTES / (1024 * 1024))}MB limit`,
      );
    }
    if (!ALLOWED_MIME_TYPES.has(file.mimetype)) {
      await this.safeUnlink(file.path);
      throw new BadRequestException(`Unsupported file type: ${file.mimetype}`);
    }

    const caseRow = await this.prisma.case.findFirst({
      where: { id: caseId, deletedAt: null },
      select: { id: true },
    });
    if (!caseRow) {
      await this.safeUnlink(file.path);
      throw new NotFoundException('Case not found');
    }

    const checksum = await this.sha256(file.path);
    // storageKey is relative to UPLOAD_ROOT (per-case subfolder + stored name).
    const storageKey = path.relative(UPLOAD_ROOT, file.path);

    const created = await this.prisma.document.create({
      data: {
        case: { connect: { id: caseId } },
        category: dto.category ?? DocumentCategory.OTHER,
        title: dto.title?.trim() || file.originalname,
        description: dto.description,
        fileName: file.originalname,
        storageKey,
        mimeType: file.mimetype,
        sizeBytes: file.size,
        checksum,
        tags: dto.tags ?? [],
        uploadedBy: actorId ? { connect: { id: actorId } } : undefined,
      },
    });

    await this.audit.record({
      userId: actorId,
      action: AuditAction.UPLOAD,
      entity: 'Document',
      entityId: created.id,
      after: { caseId, fileName: created.fileName, checksum },
    });
    return created;
  }

  async findAll(caseId: string, dto: QueryDocumentDto) {
    const where: Prisma.DocumentWhereInput = {
      caseId,
      deletedAt: null,
      ...(dto.category ? { category: dto.category } : {}),
      ...(dto.tag ? { tags: { has: dto.tag } } : {}),
      ...(dto.search
        ? {
            OR: [
              { title: { contains: dto.search, mode: 'insensitive' } },
              { fileName: { contains: dto.search, mode: 'insensitive' } },
              { tags: { has: dto.search } },
            ],
          }
        : {}),
    };

    const orderBy = dto.sortBy
      ? { [dto.sortBy]: dto.sortDir ?? 'desc' }
      : { createdAt: 'desc' as const };

    const [rows, total] = await this.prisma.$transaction([
      this.prisma.document.findMany({
        where,
        skip: dto.skip,
        take: dto.take,
        orderBy,
        include: {
          uploadedBy: { select: { id: true, fullName: true } },
        },
      }),
      this.prisma.document.count({ where }),
    ]);
    return paginate(rows, total, dto);
  }

  async findOne(id: string) {
    const doc = await this.prisma.document.findFirst({
      where: { id, deletedAt: null },
      include: { uploadedBy: { select: { id: true, fullName: true } } },
    });
    if (!doc) throw new NotFoundException('Document not found');
    return doc;
  }

  /**
   * Returns the document row plus an absolute path and a readable stream so the
   * controller can pipe it to the response with the right content-type.
   */
  async getDownload(id: string, actorId?: string) {
    const doc = await this.findOne(id);
    const absolutePath = path.resolve(UPLOAD_ROOT, doc.storageKey);
    try {
      await fsp.access(absolutePath);
    } catch {
      throw new NotFoundException('Stored file is missing');
    }
    const stream = createReadStream(absolutePath);

    await this.audit.record({
      userId: actorId,
      action: AuditAction.DOWNLOAD,
      entity: 'Document',
      entityId: doc.id,
    });
    return { doc, stream };
  }

  async remove(id: string, actorId?: string) {
    const doc = await this.prisma.document.findFirst({
      where: { id, deletedAt: null },
      select: { id: true },
    });
    if (!doc) throw new NotFoundException('Document not found');

    await this.prisma.document.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
    await this.audit.record({
      userId: actorId,
      action: AuditAction.DELETE,
      entity: 'Document',
      entityId: id,
    });
    return { success: true };
  }

  private sha256(filePath: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const hash = createHash('sha256');
      const stream = createReadStream(filePath);
      stream.on('error', reject);
      stream.on('data', (chunk) => hash.update(chunk));
      stream.on('end', () => resolve(hash.digest('hex')));
    });
  }

  private async safeUnlink(filePath?: string) {
    if (!filePath) return;
    try {
      await fsp.unlink(filePath);
    } catch {
      // best-effort cleanup; ignore
    }
  }
}
