import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module.js";
import { configureApp } from "./configure-app.js";

// Local defaults; the hosting platform sets HOST and PORT (e.g. HOST=0.0.0.0).
const HOST = process.env.HOST ?? "127.0.0.1";
const PORT = Number(process.env.PORT ?? 3000);

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  configureApp(app);
  await app.listen(PORT, HOST);
}

void bootstrap();
