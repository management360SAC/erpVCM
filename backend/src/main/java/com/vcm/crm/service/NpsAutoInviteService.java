package com.vcm.crm.service;

import com.vcm.crm.entity.ClientService;
import com.vcm.crm.entity.Client;
import com.vcm.crm.entity.NpsInvite;
import com.vcm.crm.repository.ClientServiceRepository;
import com.vcm.crm.repository.NpsInviteRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class NpsAutoInviteService {

    private final ClientServiceRepository clientServiceRepository;
    private final NpsInviteRepository npsInviteRepository;
    private final MailService mailService; // usamos el mismo que en EmailCampaignService

    @Value("${app.nps.base-url:https://tu-dominio.com/nps}")
    private String npsBaseUrl;

    /**
     * Job diario: envía invitaciones NPS el día de end_date.
     * Corre a las 09:00 AM hora Lima.
     */
    @Scheduled(cron = "0 0 9 * * *", zone = "America/Lima")
    public void sendDailyNpsInvites() {
        LocalDate today = LocalDate.now(ZoneId.of("America/Lima"));
        log.info("[NPS] Iniciando envío automático de encuestas para fecha {}", today);

        // 1) Buscar servicios que terminan hoy y están activos
        List<ClientService> endingToday =
                clientServiceRepository.findByEndDateAndActiveTrue(today);

        int sent = 0;

        for (ClientService cs : endingToday) {
            Long clientServiceId = cs.getId().longValue();

            // 2) Evitar duplicados (si ya existe invitación para este client_service)
            boolean alreadyExists = npsInviteRepository
                    .findAll()
                    .stream()
                    .anyMatch(inv -> inv.getClientService() != null
                            && inv.getClientService().getId().longValue() == clientServiceId);

            if (alreadyExists) {
                log.info("[NPS] Ya existe invitación para client_service_id={}, se omite.", clientServiceId);
                continue;
            }

            Client client = cs.getClient();
            if (client == null || client.getEmail() == null || client.getEmail().trim().isEmpty()) {
                log.warn("[NPS] client_service_id={} no tiene email de cliente, se omite.", clientServiceId);
                continue;
            }

            try {
                crearInvitacionYEnviarCorreo(cs, client);
                sent++;
            } catch (Exception ex) {
                log.error("[NPS] Error enviando encuesta para client_service_id={}: {}",
                        clientServiceId, ex.getMessage(), ex);
            }
        }

        log.info("[NPS] Proceso diario completado. Invitaciones enviadas: {}", sent);
    }

    // ----- Helpers -----

    private void crearInvitacionYEnviarCorreo(ClientService cs, Client client) {
        LocalDateTime now = LocalDateTime.now(ZoneId.of("America/Lima"));

        // 1) Crear token
        String token = UUID.randomUUID().toString();

        // 2) Registrar invitación en BD
        NpsInvite invite = new NpsInvite();
        invite.setClientService(cs);
        invite.setEmail(client.getEmail());
        invite.setToken(token);
        invite.setSentAt(now);
        invite.setExpiresAt(now.plusDays(15)); // por ejemplo, 15 días de vigencia
        invite.setStatus(NpsInvite.Status.SENT);

        npsInviteRepository.save(invite);

        // 3) Construir link
        String surveyUrl = npsBaseUrl + "?token=" + token;

        // 4) Enviar correo con HTML
        String subject = "Ayúdanos calificando el servicio que recibiste";
        String bodyHtml = buildEmailBody(client, cs, surveyUrl);

        mailService.sendHtml(client.getEmail(), subject, bodyHtml);

        log.info("[NPS] Invitación enviada a {} para client_service_id={}",
                client.getEmail(), cs.getId());
    }

    /**
     * HTML del correo de NPS con estilo similar a tus campañas:
     * - Tarjeta centrada
     * - Texto inicial
     * - Botón grande para responder
     * - Banner de imagen sobre calificar servicio
     */
    private String buildEmailBody(Client client, ClientService cs, String surveyUrl) {
        String clientName = client.getLegalName() != null && !client.getLegalName().trim().isEmpty()
                ? client.getLegalName()
                : (client.getEmail() != null ? client.getEmail() : "cliente");

        String serviceName = (cs.getService() != null && cs.getService().getName() != null)
                ? cs.getService().getName()
                : "nuestro servicio";

        // 👉 Imagen local desde tu frontend Vite
        String bannerUrl = "http://localhost:5173/images/encuestaVCM.png";

        return ""
                + "<!DOCTYPE html>"
                + "<html lang='es'>"
                + "<head>"
                + "  <meta charset='UTF-8' />"
                + "  <title>Encuesta de satisfacción</title>"
                + "  <meta name='viewport' content='width=device-width, initial-scale=1.0' />"
                + "</head>"
                + "<body style=\"margin:0;padding:0;background-color:#f5f5f7;font-family:Arial,Helvetica,sans-serif;\">"
                + "  <table role='presentation' cellpadding='0' cellspacing='0' width='100%' "
                + "         style='background-color:#f5f5f7;padding:30px 0;'>"
                + "    <tr>"
                + "      <td align='center'>"

                // Tarjeta blanca
                + "        <table role='presentation' cellpadding='0' cellspacing='0' width='600' "
                + "               style='background-color:#ffffff;border-radius:8px;overflow:hidden;"
                + "                      border:1px solid #e5e7eb;'>"

                // Encabezado
                + "          <tr>"
                + "            <td style='padding:24px 32px 8px 32px;text-align:center;'>"
                + "              <div style='display:inline-block;width:32px;height:32px;border-radius:999px;"
                + "                          background:#0ea5e9;color:#ffffff;font-weight:bold;"
                + "                          line-height:32px;font-size:18px;'>?</div>"
                + "              <h2 style='margin:16px 0 8px 0;font-size:22px;color:#111827;'>"
                + "                Hola " + escapeHtml(clientName) + ", ¿cómo calificas el servicio que recibiste?"
                + "              </h2>"
                + "              <p style='margin:0;font-size:14px;color:#4b5563;line-height:1.6;'>"
                + "                Gracias por confiar en <strong>" + escapeHtml(serviceName) + "</strong>."
                + "                Tu opinión es muy importante para seguir mejorando la calidad de nuestro trabajo."
                + "              </p>"
                + "            </td>"
                + "          </tr>"

                // Botón
                + "          <tr>"
                + "            <td style='padding:8px 32px 24px 32px;text-align:center;'>"
                + "              <p style='margin:0 0 16px 0;font-size:14px;color:#4b5563;line-height:1.6;'>"
                + "                Te tomará menos de un minuto responder esta breve encuesta."
                + "              </p>"
                + "              <a href='" + surveyUrl + "' "
                + "                 style='display:inline-block;padding:12px 32px;border-radius:999px;"
                + "                        background:#0ea5e9;color:#ffffff;font-weight:600;font-size:14px;"
                + "                        text-decoration:none;'>"
                + "                Responder encuesta"
                + "              </a>"
                + "            </td>"
                + "          </tr>"

                // Imagen centrada con padding en TODOS los lados
                + "          <tr>"
                + "            <td style='padding:32px 32px 32px 32px; text-align:center;'>"
                + "              <img src='" + bannerUrl + "' alt='Encuesta VCM' "
                + "                   style='width:100%; max-width:500px; display:block; margin:0 auto; border:0;' />"
                + "            </td>"
                + "          </tr>"

                // Link de fallback
                + "          <tr>"
                + "            <td style='padding:0 32px 24px 32px;text-align:center;'>"
                + "              <p style='margin:0;font-size:12px;color:#9ca3af;line-height:1.6;'>"
                + "                Si el botón no funciona, copia y pega este enlace en tu navegador:<br/>"
                + "                <a href='" + surveyUrl + "' style='color:#0ea5e9;font-size:12px;'>"
                +                    surveyUrl
                + "                </a>"
                + "              </p>"
                + "            </td>"
                + "          </tr>"

                + "        </table>"

                // Pie de página
                + "        <p style='margin-top:16px;font-size:11px;color:#9ca3af;text-align:center;'>"
                + "          © " + LocalDate.now(ZoneId.of("America/Lima")).getYear()
                + "          VCM Consultores. Todos los derechos reservados."
                + "        </p>"

                + "      </td>"
                + "    </tr>"
                + "  </table>"
                + "</body>"
                + "</html>";
    }


    /** Pequeño helper para evitar problemas con caracteres especiales en HTML */
    private String escapeHtml(String text) {
        if (text == null) return "";
        return text
                .replace("&", "&amp;")
                .replace("<", "&lt;")
                .replace(">", "&gt;")
                .replace("\"", "&quot;")
                .replace("'", "&#39;");
    }
}
