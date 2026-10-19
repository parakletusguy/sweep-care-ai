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
};
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
): ResourceReply {
  const base = {
    modelVersion: "retrieval-only-v1",
    promptVersion: "resource-navigation-v1",
  };
  const text = message.toLowerCase();
  if (
    /suicid|kill myself|end my life|hurt myself|self.harm|immediate danger/.test(
      text,
    )
  )
    return {
      ...base,
      mode: "SAFETY",
      text: "If you are in immediate danger, contact local emergency services or a healthcare professional now. You can also contact a trusted person nearby. This assistant cannot contact emergency services or notify care staff for you.",
      resources: [],
    };
  if (
    /ignore.{0,30}instructions|jailbreak|system prompt|invent.{0,30}(study|citation|evidence)|diagnos|medication|dosage|prescrib|fire.{0,20}(employee|worker)|dismiss|terminate.{0,20}(employee|contract)|pretend.{0,20}(doctor|therapist)/.test(
      text,
    )
  )
    return {
      ...base,
      mode: "REFUSED",
      text: "I can help find approved resources. I cannot diagnose conditions, advise on medication, invent evidence, or make employment decisions.",
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
        text: "These resources were reviewed by your organization. The excerpts below are retrieved text, not generated advice.",
        resources,
      }
    : {
        ...base,
        mode: "REFUSED",
        text: "I do not have enough verified information to support that claim. No approved resource matched your request. Try a specific topic or ask your organization’s care team.",
        resources: [],
      };
}
