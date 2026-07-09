import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/**
 * Integração futura com a API do WhatsApp Business (Parte 11). Nenhum
 * provedor está contratado ainda — sem WHATSAPP_API_URL/WHATSAPP_API_TOKEN
 * configurados, o envio só é registrado em log, para que o restante do
 * monitoramento de oportunidades continue funcionando normalmente.
 */
@Injectable()
export class WhatsappNotifierService {
  private readonly logger = new Logger(WhatsappNotifierService.name);

  constructor(private readonly configService: ConfigService) {}

  isConfigured(): boolean {
    return Boolean(this.configService.get<string>('whatsapp.apiUrl'));
  }

  async send(to: string, message: string): Promise<void> {
    const apiUrl = this.configService.get<string>('whatsapp.apiUrl');
    const apiToken = this.configService.get<string>('whatsapp.apiToken');

    if (!apiUrl || !apiToken) {
      this.logger.log(
        `WhatsApp API não configurada — mensagem para ${to} não enviada: "${message}"`,
      );
      return;
    }

    try {
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiToken}`,
        },
        body: JSON.stringify({ to, message }),
      });

      if (!response.ok) {
        this.logger.error(
          `Falha ao enviar mensagem WhatsApp para ${to}: HTTP ${response.status}`,
        );
      }
    } catch (error) {
      this.logger.error(
        `Falha ao enviar mensagem WhatsApp para ${to}: ${(error as Error).message}`,
      );
    }
  }
}
