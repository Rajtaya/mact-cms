import { OmitType, PartialType } from '@nestjs/swagger';
import { CreateCaseDto } from './create-case.dto';

/**
 * Update only touches scalar/basic fields + petition + accident. Nested
 * collections (claimants, vehicles…) are managed via their own sub-resource
 * endpoints to keep updates predictable and auditable.
 */
export class UpdateCaseDto extends PartialType(
  OmitType(CreateCaseDto, [
    'claimants',
    'victims',
    'vehicles',
    'respondents',
    'witnesses',
  ] as const),
) {}
