import { Module } from "@nestjs/common";
import { AuthConfig } from "./auth.config.js";
import { AuthController } from "./auth.controller.js";
import { AuthGuard } from "./auth.guard.js";
import { AuthService } from "./auth.service.js";
import { AuthTokenService } from "./auth-token.service.js";
import { EmailCodeSender } from "./email-code-sender.service.js";
import { OidcVerifierService } from "./oidc-verifier.service.js";

@Module({
  controllers: [AuthController],
  exports: [AuthConfig, AuthGuard, AuthTokenService],
  providers: [
    AuthConfig,
    AuthTokenService,
    EmailCodeSender,
    OidcVerifierService,
    AuthService,
    AuthGuard
  ]
})
// Nest modules are declarative classes consumed through decorator metadata.
// eslint-disable-next-line @typescript-eslint/no-extraneous-class
export class AuthModule {}
