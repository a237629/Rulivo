import { Inject, Injectable } from "@nestjs/common";
import nodemailer, { type Transporter } from "nodemailer";
import { AuthConfig } from "./auth.config.js";

@Injectable()
export class EmailCodeSender {
  private readonly transporter?: Transporter;

  public constructor(@Inject(AuthConfig) private readonly config: AuthConfig) {
    if (config.deliveryMode === "smtp") {
      const host = process.env.SMTP_HOST;
      if (host === undefined || host.length === 0) {
        throw new Error("SMTP_HOST is required in SMTP delivery mode.");
      }
      this.transporter = nodemailer.createTransport({
        host,
        port: Number(process.env.SMTP_PORT ?? "587"),
        secure: process.env.SMTP_SECURE === "true",
        ...(process.env.SMTP_USER !== undefined
          ? {
              auth: {
                pass: process.env.SMTP_PASSWORD ?? "",
                user: process.env.SMTP_USER
              }
            }
          : {})
      });
    }
  }

  public async send(email: string, code: string): Promise<void> {
    if (this.transporter === undefined) return;
    await this.transporter.sendMail({
      from: this.config.emailFrom,
      subject: "Your RULIVO verification code",
      text: `Your RULIVO verification code is ${code}. It expires in 10 minutes.`,
      to: email
    });
  }
}
