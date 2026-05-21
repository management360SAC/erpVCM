package com.vcm.crm.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.vcm.crm.dto.AiDtos;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestTemplate;

import javax.mail.internet.InternetAddress;

@Service
public class AiService {

    private static final String GEMINI_CHAT_URL =
            "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=";

    private static final String GEMINI_IMAGE_URL =
            "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent?key=";

    private static final String SYSTEM_PROMPT =
            "Eres el Asistente IA de VCM Group, una firma consultora peruana especializada en servicios " +
            "contables, fiscales y administrativos. Operas dentro del CRM interno de la empresa.\n\n" +
            "Reglas generales:\n" +
            "- Responde siempre en español.\n" +
            "- Sé conciso, profesional y directo.\n" +
            "- Usa los datos del CRM que se te proporcionan como contexto real.\n" +
            "- Si los datos no son suficientes para responder con precisión, indícalo claramente.\n" +
            "- No inventes datos que no estén en el contexto.\n\n" +
            "Regla especial para ENVÍO DE CORREOS:\n" +
            "Cuando el usuario pida enviar, redactar o preparar un correo electrónico, responde ÚNICAMENTE " +
            "con el siguiente bloque JSON (sin texto antes ni después, sin markdown):\n" +
            "<<EMAIL_DRAFT>>\n" +
            "{\"to\":\"email\",\"subject\":\"asunto\",\"htmlBody\":\"<p>cuerpo</p>\"}\n" +
            "<<END_EMAIL_DRAFT>>\n" +
            "Si el correo incluye una COTIZACIÓN (menciona servicio y precio), añade el campo 'quotePdf':\n" +
            "<<EMAIL_DRAFT>>\n" +
            "{\"to\":\"email\",\"subject\":\"asunto\",\"htmlBody\":\"<p>cuerpo</p>\"," +
            "\"quotePdf\":{\"service\":\"Nombre del servicio\",\"price\":1800,\"clientName\":\"Nombre cliente\"," +
            "\"clientEmail\":\"email\",\"description\":\"Descripción del servicio\"}}\n" +
            "<<END_EMAIL_DRAFT>>\n" +
            "Reglas del campo quotePdf: 'price' es número (sin S/), 'clientEmail' igual a 'to' si no se especifica otro.\n" +
            "Si el destinatario no se menciona, deja 'to' vacío (\"\").\n" +
            "El campo 'htmlBody' debe ser HTML válido con párrafos <p>, listo para enviar.\n";

    @Value("${app.ai.gemini.api-key:}")
    private String geminiApiKey;

    private final AiContextService contextService;
    private final MailService mailService;
    private final RestTemplate restTemplate;
    private final ObjectMapper mapper;

    public AiService(AiContextService contextService, MailService mailService, ObjectMapper mapper) {
        this.contextService = contextService;
        this.mailService    = mailService;
        this.restTemplate   = new RestTemplate();
        this.mapper         = mapper;
    }

    // ── Chat ──────────────────────────────────────────────────────────────────

    public String chat(String message, String contextType) throws Exception {
        if (geminiApiKey == null || geminiApiKey.trim().isEmpty()) {
            return "El asistente IA no está configurado. Contacta al administrador para activar la clave de Gemini.";
        }
        String crmContext = contextService.buildContext(contextType);
        String fullPrompt = SYSTEM_PROMPT +
               "\n[CONTEXTO CRM — " + contextType.toUpperCase() + "]\n" +
               crmContext +
               "\n[FIN CONTEXTO]\n\n" +
               "Pregunta del usuario: " + message;
        return callGemini(fullPrompt);
    }

    // ── Generación de imagen infográfica ─────────────────────────────────────

    public AiDtos.AiImageResponse generateFiscalImage(String userPrompt) throws Exception {
        if (geminiApiKey == null || geminiApiKey.trim().isEmpty()) {
            throw new IllegalStateException("El asistente IA no está configurado. Contacta al administrador.");
        }

        String base64Data = null;
        String mimeType   = "image/png";

        for (int attempt = 1; attempt <= 2; attempt++) {
            String[] result = callGeminiImageGeneration(userPrompt);
            mimeType   = result[0];
            base64Data = result[1];

            String spellingCheck = checkSpellingInImage(base64Data, mimeType);
            if (spellingCheck.startsWith("OK") || attempt == 2) break;
        }

        String dataUrl = "data:" + mimeType + ";base64," + base64Data;
        return new AiDtos.AiImageResponse(dataUrl, "");
    }

    private String[] callGeminiImageGeneration(String userPrompt) throws Exception {
        String fullPrompt =
                "A clean, professional infographic created by VCM Group (Grupo VCM), a Peruvian consulting firm " +
                "specialized in fiscal, labor and administrative advisory services. " +
                "Color palette: warm orange (#f57c00) and medium grey (#5a5a5a) on an off-white (#fafafa) background. " +
                "All content, data and context belongs to VCM Group and its services in Peru. " +
                "Topic: " + userPrompt + ". Context: asesoría fiscal, laboral y administrativa en Perú " +
                "(SUNAT, remuneraciones, contratos laborales, obligaciones tributarias, normativa peruana). " +
                "Design requirements: " +
                "- Leave a clean empty white strip at the very top of the image (about 12% of total height) with absolutely no text, icons or graphics, reserved for a company logo overlay. This strip must be completely blank white. " +
                "- Elegant structured modules or columns clearly separated by thin lines. " +
                "- Section titles in bold orange, body text in dark grey, all in Spanish. " +
                "- Subtle geometric icons (scales, gavels, files, documents, charts) styled with the same orange/grey palette. " +
                "- Small illustrative elements and bullet-point areas per section. " +
                "- All text labels and titles in Spanish, perfectly spelled with correct accents. " +
                "- Layout: detailed front-on shot, balanced and polished, ready for presentation. " +
                "- NO realistic human faces. NO logos, watermarks, or brand names anywhere in the image. " +
                "- Do NOT write 'VCM', 'Grupo VCM', 'VCM Group' or any company name as text in the image. " +
                "- Aspect ratio: 4:5, portrait orientation. " +
                "CRITICAL: Every single word must have perfect Spanish spelling and correct accent marks.";

        ObjectNode root = mapper.createObjectNode();
        ArrayNode contents = root.putArray("contents");
        ArrayNode parts = contents.addObject().putArray("parts");
        parts.addObject().put("text", fullPrompt);
        root.putObject("generationConfig").putArray("responseModalities").add("IMAGE").add("TEXT");

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        HttpEntity<String> entity = new HttpEntity<>(mapper.writeValueAsString(root), headers);

        try {
            ResponseEntity<String> response = restTemplate.exchange(
                    GEMINI_IMAGE_URL + geminiApiKey, HttpMethod.POST, entity, String.class);

            JsonNode respParts = mapper.readTree(response.getBody())
                    .path("candidates").path(0).path("content").path("parts");
            for (JsonNode part : respParts) {
                if (part.has("inlineData")) {
                    return new String[]{
                        part.path("inlineData").path("mimeType").asText("image/png"),
                        part.path("inlineData").path("data").asText()
                    };
                }
            }
            throw new RuntimeException("No se recibió imagen en la respuesta de Gemini.");

        } catch (HttpClientErrorException e) {
            int status = e.getStatusCode().value();
            if (status == 429) throw new RuntimeException("Se alcanzó el límite de generación de imágenes. Intenta en unos minutos.");
            if (status == 400) throw new RuntimeException("La descripción no pudo procesarse. Intenta reformularla.");
            if (status == 403) throw new RuntimeException("La clave de Gemini no tiene permisos para generar imágenes.");
            throw new RuntimeException("Error al generar imagen (" + status + "). Intenta de nuevo.");
        }
    }

    private String checkSpellingInImage(String base64Data, String mimeType) {
        try {
            ObjectNode root = mapper.createObjectNode();
            ArrayNode contents = root.putArray("contents");
            ArrayNode parts = contents.addObject().putArray("parts");
            parts.addObject().put("text",
                "Revisa todos los textos visibles en esta infografía. " +
                "¿Hay alguna palabra con error ortográfico o de acentuación en español? " +
                "Responde SOLO con 'OK' si todo está correcto, o 'ERRORES' si encuentras algún problema.");
            ObjectNode inlineData = parts.addObject().putObject("inlineData");
            inlineData.put("mimeType", mimeType);
            inlineData.put("data", base64Data);

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            HttpEntity<String> entity = new HttpEntity<>(mapper.writeValueAsString(root), headers);

            ResponseEntity<String> response = restTemplate.exchange(
                    GEMINI_CHAT_URL + geminiApiKey, HttpMethod.POST, entity, String.class);

            JsonNode text = mapper.readTree(response.getBody())
                    .path("candidates").path(0).path("content").path("parts").path(0).path("text");
            return text.isMissingNode() ? "OK" : text.asText().trim();

        } catch (Exception e) {
            return "OK";
        }
    }

    // ── Envío de email desde el asistente ────────────────────────────────────

    public void sendEmail(String to, String subject, String htmlBody, byte[] pdfBytes, String pdfFilename) {
        try {
            new InternetAddress(to).validate();
        } catch (Exception e) {
            throw new IllegalArgumentException("Dirección de correo inválida: " + to);
        }
        if (pdfBytes != null && pdfBytes.length > 0) {
            mailService.sendQuote(to, subject, htmlBody, pdfBytes, pdfFilename);
        } else {
            mailService.sendHtml(to, subject, htmlBody);
        }
    }

    // ── Llamada base a Gemini ─────────────────────────────────────────────────

    private String callGemini(String prompt) throws Exception {
        ObjectNode root = mapper.createObjectNode();
        ArrayNode contents = root.putArray("contents");
        ArrayNode parts = contents.addObject().putArray("parts");
        parts.addObject().put("text", prompt);

        ObjectNode generationConfig = root.putObject("generationConfig");
        generationConfig.put("temperature", 0.7);
        generationConfig.put("maxOutputTokens", 4096);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        HttpEntity<String> entity = new HttpEntity<>(mapper.writeValueAsString(root), headers);

        try {
            ResponseEntity<String> response = restTemplate.exchange(
                    GEMINI_CHAT_URL + geminiApiKey, HttpMethod.POST, entity, String.class);
            return extractGeminiText(response.getBody());

        } catch (HttpClientErrorException e) {
            int status = e.getStatusCode().value();
            if (status == 429) return "El asistente alcanzó el límite de consultas por hoy. Se renueva automáticamente mañana.";
            if (status == 400) return "La consulta no pudo procesarse. Intenta reformular tu pregunta.";
            if (status == 403) return "La clave de API no tiene permisos suficientes. Contacta al administrador.";
            return "Error al conectar con Gemini (" + status + "). Intenta de nuevo en unos minutos.";
        } catch (Exception e) {
            if (e.getMessage() != null && e.getMessage().contains("Connection refused")) {
                return "No se pudo conectar con el servicio de IA. Verifica la conexión a internet del servidor.";
            }
            throw e;
        }
    }

    private String extractGeminiText(String responseBody) throws Exception {
        JsonNode root = mapper.readTree(responseBody);
        JsonNode text = root
                .path("candidates").path(0)
                .path("content").path("parts").path(0)
                .path("text");
        if (text.isMissingNode() || text.isNull()) {
            JsonNode error = root.path("error").path("message");
            if (!error.isMissingNode()) return "Error de Gemini: " + error.asText();
            return "No se pudo obtener respuesta del asistente.";
        }
        return text.asText();
    }
}
