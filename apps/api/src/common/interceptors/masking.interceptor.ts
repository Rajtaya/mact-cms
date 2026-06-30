import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import {
  SENSITIVE_FIELDS,
  canViewRawKyc,
  maskValue,
} from '../utils/mask';

/**
 * Globally masks KYC fields (Aadhaar, bank account no.) in every response
 * unless the requesting user is an Administrator or (Senior) Advocate.
 * Walks the serialized payload recursively. Privileged roles bypass entirely.
 */
@Injectable()
export class MaskingInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const req = context.switchToHttp().getRequest();
    const role = req.user?.role;

    return next.handle().pipe(
      map((data) => (canViewRawKyc(role) ? data : this.scrub(data))),
    );
  }

  private scrub(node: any, seen = new WeakSet()): any {
    if (node == null || typeof node !== 'object') return node;
    if (seen.has(node)) return node;
    seen.add(node);

    if (Array.isArray(node)) {
      return node.map((item) => this.scrub(item, seen));
    }

    for (const key of Object.keys(node)) {
      const val = node[key];
      if (SENSITIVE_FIELDS.has(key) && typeof val === 'string' && val) {
        node[key] = maskValue(val);
      } else if (val && typeof val === 'object') {
        node[key] = this.scrub(val, seen);
      }
    }
    return node;
  }
}
