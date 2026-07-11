import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const req = context.switchToHttp().getRequest();
    const { method, url, ip } = req;
    const userAgent = req.get('user-agent') || '';
    const userId = req.user?.id || 'anonymous';
    const start = Date.now();

    return next.handle().pipe(
      tap({
        next: () => {
          const res = context.switchToHttp().getResponse();
          const { statusCode } = res;
          const responseTime = Date.now() - start;
          this.logger.log(
            `${method} ${url} ${statusCode} ${responseTime}ms — user:${userId} ip:${ip} agent:${userAgent}`,
          );
        },
        error: (err) => {
          const responseTime = Date.now() - start;
          this.logger.error(
            `${method} ${url} ${err.status || 500} ${responseTime}ms — user:${userId}`,
          );
        },
      }),
    );
  }
}
