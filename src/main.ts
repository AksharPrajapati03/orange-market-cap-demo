import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as dotenv from 'dotenv';
// import * as fs from 'fs';

async function bootstrap() {
  dotenv.config();
  const app = await NestFactory.create(AppModule);
  // const httpsOptions = {
  //   key: fs.readFileSync('./nestjs.key'),
  //   cert: fs.readFileSync('./nestjs.crt'),
  // };

  // const app = await NestFactory.create(AppModule, { httpsOptions });

  app.enableCors();

  await app.listen(3000);
}
bootstrap();
