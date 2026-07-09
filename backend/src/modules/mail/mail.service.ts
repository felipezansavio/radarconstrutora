import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createTransport, type Transporter } from 'nodemailer';

export interface SendMailInput {
  to: string;
  subject: string;
  text: string;
  html?: string;
}

/**
 * Envio de e-mail transacional (alertas de oportunidades, etc.). Sem SMTP
 * configurado, o envio apenas é registrado em log — assim o restante da
 * aplicação nunca falha por causa de um provedor de e-mail ausente, no
 * mesmo espírito das fontes externas do módulo de ingestão.
 */
@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private readonly transporter: Transporter | null;
  private readonly from: string;

  constructor(private readonly configService: ConfigService) {
    const host = this.configService.get<string>('mail.host');
    this.from = this.configService.get<string>('mail.from')!;

    this.transporter = host
      ? createTransport({
          host,
          port: this.configService.get<number>('mail.port'),
          secure: this.configService.get<boolean>('mail.secure'),
          auth: this.configService.get<string>('mail.user')
            ? {
                user: this.configService.get<string>('mail.user'),
                pass: this.configService.get<string>('mail.password'),
              }
            : undefined,
        })
      : null;
  }

  isConfigured(): boolean {
    return this.transporter !== null;
  }

  async send(input: SendMailInput): Promise<void> {
    if (!this.transporter) {
      this.logger.log(
        `SMTP não configurado — e-mail para ${input.to} não enviado: "${input.subject}"`,
      );
      return;
    }

    try {
      await this.transporter.sendMail({
        from: this.from,
        to: input.to,
        subject: input.subject,
        text: input.text,
        html: input.html,
      });
    } catch (error) {
      this.logger.error(
        `Falha ao enviar e-mail para ${input.to}: ${(error as Error).message}`,
      );
    }
  }
}
