import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';

const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;

/**
 * HTML <input type="date"> sends date-only strings ("2026-07-15"), but Prisma's
 * DateTime columns require a full ISO-8601 timestamp. This interceptor runs
 * before the ValidationPipe and promotes any date-only string in the request
 * body to midnight UTC ("2026-07-15T00:00:00.000Z"), so dated fields persist
 * correctly everywhere without per-DTO conversion.
 */
@Injectable()
export class DateCoercionInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const req = context.switchToHttp().getRequest();
    if (req?.body && typeof req.body === 'object') {
      this.coerce(req.body);
    }
    return next.handle();
  }

  private coerce(node: any, seen = new WeakSet()): void {
    if (node == null || typeof node !== 'object') return;
    if (seen.has(node)) return;
    seen.add(node);

    if (Array.isArray(node)) {
      node.forEach((v, i) => {
        if (typeof v === 'string' && DATE_ONLY.test(v)) {
          node[i] = `${v}T00:00:00.000Z`;
        } else if (v && typeof v === 'object') {
          this.coerce(v, seen);
        }
      });
      return;
    }

    for (const key of Object.keys(node)) {
      const v = node[key];
      if (typeof v === 'string' && DATE_ONLY.test(v)) {
        node[key] = `${v}T00:00:00.000Z`;
      } else if (v && typeof v === 'object') {
        this.coerce(v, seen);
      }
    }
  }
}
