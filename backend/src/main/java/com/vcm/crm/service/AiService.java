package com.vcm.crm.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

@Service
public class AiService {

    private static final String GEMINI_URL =
            "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=";

    private static final String SYSTEM_PROMPT =
            "Eres el Asistente IA de VCM Group, una firma consultora peruana especializada en servicios " +
            "contables, fiscales y administrativos. Operas dentro del CRM interno de la empresa.\n\n" +
            "Reglas:\n" +
            "- Responde siempre en español.\n" +
            "- Sé conciso, profesional y directo.\n" +
            "- Usa los datos del CRM que se te proporcionan como contexto real.\n" +
            "- Si te piden redactar un texto (email, mensaje), hazlo completo y listo para usar.\n" +
            "- Si los datos no son suficientes para responder con precisión, indícalo claramente.\n" +
            "- No inventes datos que no estén en el contexto.\n";

    @Value("${app.ai.gemini.api-key:}")
    private String geminiApiKey;

    private final AiContextService contextService;
    private final RestTemplate restTemplate;
    private final ObjectMapper mapper;

    public AiService(AiContextService contextService, ObjectMapper mapper) {
        this.contextService = contextService;
        this.restTemplate  = new RestTemplate();
        this.mapper        = mapper;
    }

    public String chat(String message, String contextType) throws Exception {
        if (geminiApiKey == null || geminiApiKey.trim().isEmpty()) {
            return "El asistente IA no está configurado. Contacta al administrador para activar la clave de Gemini.";
        }

        String crmContext = contextService.buildContext(contextType);
        String fullPrompt = buildPrompt(message, contextType, crmContext);

        return callGemini(fullPrompt);
    }

    // ── Construye el prompt completo con sistema + contexto + pregunta ────────

    private String buildPrompt(String message, String contextType, String crmContext) {
        return SYSTEM_PROMPT +
               "\n[CONTEXTO CRM — " + contextType.toUpperCase() + "]\n" +
               crmContext +
               "\n[FIN CONTEXTO]\n\n" +
               "Pregunta del usuario: " + message;
    }

    // ── Llama a la API de Gemini ──────────────────────────────────────────────

    private String callGemini(String prompt) throws Exception {
        ObjectNode root = mapper.createObjectNode();
        ArrayNode contents = root.putArray("contents");
        ObjectNode content = contents.addObject();
        ArrayNode parts = content.putArray("parts");
        parts.addObject().put("text", prompt);

        ObjectNode generationConfig = root.putObject("generationConfig");
        generationConfig.put("temperature", 0.7);
        generationConfig.put("maxOutputTokens", 1024);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);

        HttpEntity<String> entity = new HttpEntity<>(mapper.writeValueAsString(root), headers);

        ResponseEntity<String> response = restTemplate.exchange(
                GEMINI_URL + geminiApiKey,
                HttpMethod.POST,
                entity,
                String.class
        );

        return extractGeminiText(response.getBody());
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
