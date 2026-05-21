// src/main/java/com/vcm/crm/service/MailService.java
package com.vcm.crm.service;

import org.springframework.beans.factory.ObjectProvider;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;

import javax.mail.internet.MimeMessage;
import javax.mail.util.ByteArrayDataSource;

@Service
public class MailService {

    private final ObjectProvider<JavaMailSender> senderProvider;

    @Value("${spring.mail.username:}")
    private String fromAddress;

    public MailService(ObjectProvider<JavaMailSender> senderProvider) {
        this.senderProvider = senderProvider;
    }

    /* =====================================================
             ENVÍO DE CORREO HTML + IMAGEN EMBEBIDA
       ===================================================== */
    public void sendHtmlWithInlineImage(
            String to,
            String subject,
            String htmlBody,
            byte[] imageBytes,
            String imageContentType
    ) {
        JavaMailSender sender = senderProvider.getIfAvailable();
        if (sender == null) {
            System.out.println("[MailService] No JavaMailSender. Se omite envío a " + to);
            return;
        }

        try {
            MimeMessage msg = sender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(msg, true, "UTF-8");

            helper.setFrom(fromAddress);
            helper.setTo(to);
            helper.setSubject(subject);

            String cid = "header-img";

            String htmlFinal = htmlBody;
            if (imageBytes != null && imageBytes.length > 0) {
                String imgHtml =
                        "<img src='cid:" + cid + "' " +
                        "style='" +
                        "display:block;" +
                        "margin:28px auto;" +
                        "max-width:92%;" +
                        "border-radius:12px;" +
                        "box-shadow:0 4px 16px rgba(0,0,0,0.15);" +
                        "'/>";
                htmlFinal = htmlFinal.replace("{{HEADER_IMG}}", imgHtml);
            } else {
                htmlFinal = htmlFinal.replace("{{HEADER_IMG}}", "");
            }

            helper.setText(htmlFinal, true);

            if (imageBytes != null && imageBytes.length > 0) {
                if (imageContentType == null) imageContentType = "image/png";
                ByteArrayDataSource ds = new ByteArrayDataSource(imageBytes, imageContentType);
                helper.addInline(cid, ds);
            }

            sender.send(msg);

        } catch (Exception e) {
            throw new RuntimeException("Error enviando email a " + to, e);
        }
    }

    /* =====================================================
             ENVÍO HTML SIMPLE (SIN IMAGEN)
       ===================================================== */
    public void sendHtml(String to, String subject, String htmlBody) {
        JavaMailSender sender = senderProvider.getIfAvailable();
        if (sender == null) {
            System.out.println("[MailService] No JavaMailSender. Se omite envío a " + to);
            return;
        }
        try {
            MimeMessage msg = sender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(msg, false, "UTF-8");
            helper.setFrom(fromAddress);
            helper.setTo(to);
            helper.setSubject(subject);
            helper.setText(htmlBody, true);
            sender.send(msg);
        } catch (Exception ex) {
            throw new RuntimeException("Error enviando email a " + to, ex);
        }
    }

    /* =====================================================
             ENVÍO DE COTIZACIÓN CON PDF ADJUNTO
       ===================================================== */
    public void sendQuote(
            String to,
            String subject,
            String htmlBody,
            byte[] pdfBytes,
            String originalFilename
    ) {
        JavaMailSender sender = senderProvider.getIfAvailable();
        if (sender == null) {
            System.out.println("[MailService] No JavaMailSender. Se omite envío de cotización a " + to);
            return;
        }

        try {
            MimeMessage msg = sender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(msg, true, "UTF-8");

            helper.setFrom(fromAddress);
            helper.setTo(to);
            helper.setSubject(subject);
            helper.setText(htmlBody, true);

            if (pdfBytes != null && pdfBytes.length > 0) {
                String filename = (originalFilename != null && !originalFilename.isEmpty())
                        ? originalFilename
                        : "cotizacion.pdf";
                ByteArrayDataSource ds = new ByteArrayDataSource(pdfBytes, "application/pdf");
                helper.addAttachment(filename, ds);
            }

            sender.send(msg);

        } catch (Exception ex) {
            throw new RuntimeException("Error enviando cotización por correo a " + to, ex);
        }
    }
}
