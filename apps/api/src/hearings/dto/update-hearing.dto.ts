import { PartialType } from '@nestjs/swagger';
import { CreateHearingDto } from './create-hearing.dto';

/** All hearing fields become optional on update. */
export class UpdateHearingDto extends PartialType(CreateHearingDto) {}
