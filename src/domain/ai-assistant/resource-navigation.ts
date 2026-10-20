import { parseLocale, type Locale } from "../../lib/locale";

export type ApprovedResource = {
  id: string;
  title: string;
  url: string;
  excerpt: string;
  tags: string;
  approved_at: string;
};
export type ResourceReply = {
  mode: "RETRIEVED" | "REFUSED" | "SAFETY";
  text: string;
  resources: ApprovedResource[];
  modelVersion: string;
  promptVersion: string;
  topic?: string;
};
export const assistantMessages = {
  en: {
    safety:
      "If you are in immediate danger, contact local emergency services or a healthcare professional now. You can also contact a trusted person nearby. This assistant cannot contact emergency services or notify care staff for you.",
    refused:
      "I can help find approved resources. I cannot diagnose conditions, advise on medication, invent evidence, or make employment decisions.",
    found:
      "These resources were reviewed by your organization. The excerpts below are retrieved text, not generated advice. You can ask a follow-up about this topic or start a new topic.",
    missing:
      "I do not have enough verified information to support that claim. No approved resource matched your request. Try a specific topic or ask your organization’s care team.",
  },
  fr: {
    safety:
      "Si vous êtes en danger immédiat, contactez les services d’urgence locaux ou un professionnel de santé. Vous pouvez aussi contacter une personne de confiance à proximité. Cet assistant ne peut pas contacter les urgences ni avertir l’équipe de soutien à votre place.",
    refused:
      "Je peux trouver des ressources approuvées. Je ne peux pas poser de diagnostic, conseiller des médicaments, inventer des preuves ni prendre des décisions d’emploi.",
    found:
      "Votre organisation a examiné ces ressources. Les extraits ci-dessous sont des textes sources, pas des conseils générés. Vous pouvez poser une question sur ce sujet ou en choisir un autre.",
    missing:
      "Je ne dispose pas d’informations vérifiées suffisantes pour étayer cette affirmation. Aucune ressource approuvée ne correspond. Essayez un sujet précis ou contactez l’équipe de soutien de votre organisation.",
  },
  es: {
    safety:
      "Si estás en peligro inmediato, contacta con los servicios de emergencia locales o un profesional de salud. También puedes contactar con una persona de confianza cercana. Este asistente no puede contactar con emergencias ni avisar al equipo de apoyo por ti.",
    refused:
      "Puedo encontrar recursos aprobados. No puedo diagnosticar, aconsejar sobre medicamentos, inventar pruebas ni tomar decisiones laborales.",
    found:
      "Tu organización ha revisado estos recursos. Los extractos siguientes son textos originales, no consejos generados. Puedes preguntar sobre este tema o empezar uno nuevo.",
    missing:
      "No tengo información verificada suficiente para respaldar esa afirmación. Ningún recurso aprobado coincide. Prueba un tema específico o pregunta al equipo de apoyo de tu organización.",
  },
} satisfies Record<
  Locale,
  Record<"safety" | "refused" | "found" | "missing", string>
>;

// These are conservative navigation fences, not a clinical risk classifier.
const safety =
  /suicid|kill myself|end my life|hurt myself|self.harm|immediate danger|me tuer|me faire du mal|danger immédiat|me suicidar|matarme|hacerme daño|peligro inmediato/i;
const prohibited =
  /ignore.{0,30}instructions|jailbreak|system prompt|invent.{0,30}(study|citation|evidence)|diagnos|medication|dosage|prescrib|fire.{0,20}(employee|worker)|dismiss|terminate.{0,20}(employee|contract)|pretend.{0,20}(doctor|therapist)|médicament|posologie|licencier|diagnóstico|medicamento|recetar|despedir/i;
const followUp =
  /^(more|tell me more|what else|anything else|more about that|more resources|another resource|continue|en savoir plus|plus de ressources|continuer|dime más|más recursos|continuar)[?.!\s]*$/i;
const ignored = new Set([
  "about",
  "after",
  "could",
  "does",
  "from",
  "have",
  "help",
  "please",
  "that",
  "their",
  "there",
  "these",
  "this",
  "what",
  "when",
  "where",
  "which",
  "with",
  "would",
  "your",
  "want",
  "need",
]);

/** Exact approved text only. This version does not generate health claims. */
export function navigateResources(
  message: string,
  approved: ApprovedResource[],
  options: { locale?: Locale; previousTopic?: string } = {},
): ResourceReply {
  const copy = assistantMessages[parseLocale(options.locale)];
  const base = {
    modelVersion: "retrieval-only-v1",
    promptVersion: "resource-conversation-v2",
  };
  // Context is untrusted, bounded input, never an instruction or cached answer.
  const topic =
    followUp.test(message.trim()) && options.previousTopic
      ? options.previousTopic.slice(0, 2000)
      : message;
  const text = topic.toLowerCase();
  if (safety.test(message) || safety.test(topic))
    return {
      ...base,
      mode: "SAFETY",
      text: copy.safety,
      resources: [],
    };
  if (prohibited.test(message) || prohibited.test(topic))
    return {
      ...base,
      mode: "REFUSED",
      text: copy.refused,
      resources: [],
    };
  const terms = [
    ...new Set(
      (text.match(/[a-zà-ÿ]{4,}/g) ?? []).filter((word) => !ignored.has(word)),
    ),
  ];
  const resources = approved
    .map((resource) => ({
      resource,
      score: terms.filter((term) =>
        (resource.title + " " + resource.tags).toLowerCase().includes(term),
      ).length,
    }))
    .filter(
      (match) => match.score > 0 && match.resource.url.startsWith("https://"),
    )
    .sort(
      (a, b) => b.score - a.score || a.resource.id.localeCompare(b.resource.id),
    )
    .slice(0, 3)
    .map((match) => match.resource);
  return resources.length
    ? {
        ...base,
        mode: "RETRIEVED",
        text: copy.found,
        resources,
        topic,
      }
    : {
        ...base,
        mode: "REFUSED",
        text: copy.missing,
        resources: [],
      };
}
