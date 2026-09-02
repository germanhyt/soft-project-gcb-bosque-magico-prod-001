import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { join } from 'node:path';
import { AppModule } from './app.module';
import { exceptionFactoryValidacion } from './bosque-magico/domain/utils/mensajes-validacion';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const config = app.get(ConfigService);

  app.setGlobalPrefix('api');
  app.useStaticAssets(join(process.cwd(), 'uploads'), {
    prefix: '/api/uploads',
  });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      exceptionFactory: exceptionFactoryValidacion,
    }),
  );

  const corsOrigins = (
    config.get<string>('API_CORS_ORIGINS') ?? 'http://localhost:5173'
  )
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);

  const isLocalDevOrigin = (origin: string | undefined) =>
    !origin || /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(origin);

  app.enableCors({
    origin: (
      origin: string | undefined,
      callback: (err: Error | null, allow?: boolean | string) => void,
    ) => {
      if (
        isLocalDevOrigin(origin) ||
        (origin && corsOrigins.includes(origin))
      ) {
        callback(null, origin ?? true);
      } else {
        callback(null, false);
      }
    },
    credentials: true,
  });

  const swagger = new DocumentBuilder()
    .setTitle('Bosque Mágico API')
    .setDescription('API para landing, panel y operación comercial')
    .setVersion('0.1')
    .build();
  SwaggerModule.setup(
    'api/docs',
    app,
    SwaggerModule.createDocument(app, swagger),
  );

  const port =
    config.get<number>('API_PORT') ?? config.get<number>('PORT') ?? 3000;
  await app.listen(port);
  console.log(`API Bosque Mágico: http://localhost:${port}/api`);
  console.log(`Swagger: http://localhost:${port}/api/docs`);
}
bootstrap();
