import type { INestApplication } from "@nestjs/common";

/** App-wide settings shared by the server and the tests. */
export function configureApp(app: INestApplication): void {
  app.setGlobalPrefix("api");
}
