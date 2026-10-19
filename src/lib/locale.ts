export type Locale = "en" | "fr" | "es";
export function parseLocale(value: unknown): Locale {
  return value === "fr" || value === "es" ? value : "en";
}
export const participantCopy = {
  en: {
    name: "Name",
    language: "Language",
    adult:
      "I confirm I am 18 or older. Participants under 18 need an organization-approved guardian workflow before completing assessments.",
    consentInfo:
      "Check-ins collect your selected answers and calculate a personal result. Staff manage campaigns without access to your raw answers. Withdrawal stops future submissions and removes unfinished drafts; it does not erase submitted records.",
    currentConsent: "Current consent",
    granted: "Granted",
    notGranted: "Not granted",
    withdraw: "Withdraw assessment consent",
    grant: "Grant assessment consent",
    resultInfo:
      "Custom, non-diagnostic scores calculated from the published instrument. These are not medical assessments.",
    calculated: "calculated score",
    scoringVersion: "Scoring version",
    closes: "Closes",
    assistant: "Resource assistant",
    assistantInfo:
      "Explore resources reviewed by your organization, with links to the original sources.",
    openAssistant: "Open assistant",
    answered: "answered",
    of: "of",
    quickExit: "Quick exit",
    visibility:
      "Identified check-in. Your answers and results are visible to you. HR and organization administrators cannot read them.",
    history:
      "You can pause before submitting. Submitted check-ins are kept in your assessment history.",
    draftIntro: "Your progress is saved when you choose an answer.",
    savingDraft: "Saving your draft…",
    savedDraft: "Draft saved. You can pause and return later.",
    failedDraft:
      "Draft could not be saved. Keep this page open and check your connection.",
    choose: "Choose one answer",
    pause: "Pause and return",
    submit: "Submit check-in",
    submitting: "Saving your check-in…",
    mySpace: "My space",
    organization: "Organization",
    careTeam: "Care team",
    sessions: "Sessions",
    signOut: "Sign out",
  },
  fr: {
    name: "Nom",
    language: "Langue",
    adult:
      "Je confirme avoir au moins 18 ans. Les mineurs ont besoin d’un parcours avec responsable légal approuvé par leur organisation avant de répondre aux bilans.",
    consentInfo:
      "Les bilans recueillent vos réponses et calculent un résultat personnel. Le personnel gère les campagnes sans accéder à vos réponses. Le retrait bloque les prochains envois et supprime les brouillons ; il n’efface pas les bilans déjà soumis.",
    currentConsent: "Consentement actuel",
    granted: "Accordé",
    notGranted: "Non accordé",
    withdraw: "Retirer le consentement aux bilans",
    grant: "Autoriser les bilans",
    resultInfo:
      "Scores personnalisés non diagnostiques, calculés selon l’instrument publié. Ce ne sont pas des évaluations médicales.",
    calculated: "score calculé",
    scoringVersion: "Version du calcul",
    closes: "Clôture",
    assistant: "Assistant de ressources",
    assistantInfo:
      "Consultez les ressources examinées par votre organisation, avec un lien vers les sources originales.",
    openAssistant: "Ouvrir l’assistant",
    answered: "réponses",
    of: "sur",
    quickExit: "Sortie rapide",
    visibility:
      "Bilan identifié. Vos réponses et résultats vous sont réservés. Les RH et les administrateurs ne peuvent pas les lire.",
    history:
      "Vous pouvez faire une pause avant l’envoi. Les bilans soumis sont conservés dans votre historique.",
    draftIntro: "Votre progression est enregistrée après chaque réponse.",
    savingDraft: "Enregistrement du brouillon…",
    savedDraft: "Brouillon enregistré. Vous pouvez reprendre plus tard.",
    failedDraft:
      "Impossible d’enregistrer le brouillon. Gardez cette page ouverte et vérifiez votre connexion.",
    choose: "Choisissez une réponse",
    pause: "Faire une pause",
    submit: "Envoyer le bilan",
    submitting: "Enregistrement de votre bilan…",
    mySpace: "Mon espace",
    organization: "Organisation",
    careTeam: "Équipe de soutien",
    sessions: "Séances",
    signOut: "Se déconnecter",
  },
  es: {
    name: "Nombre",
    language: "Idioma",
    adult:
      "Confirmo que tengo al menos 18 años. Los menores necesitan un proceso con tutor aprobado por su organización antes de responder a las evaluaciones.",
    consentInfo:
      "Los cuestionarios recogen tus respuestas y calculan un resultado personal. El personal administra las campañas sin acceder a tus respuestas. La retirada impide nuevos envíos y elimina los borradores; no borra los cuestionarios ya enviados.",
    currentConsent: "Consentimiento actual",
    granted: "Otorgado",
    notGranted: "No otorgado",
    withdraw: "Retirar el consentimiento",
    grant: "Dar consentimiento",
    resultInfo:
      "Puntuaciones personalizadas no diagnósticas, calculadas según el instrumento publicado. No son evaluaciones médicas.",
    calculated: "puntuación calculada",
    scoringVersion: "Versión del cálculo",
    closes: "Cierre",
    assistant: "Asistente de recursos",
    assistantInfo:
      "Explora recursos revisados por tu organización, con enlaces a las fuentes originales.",
    openAssistant: "Abrir asistente",
    answered: "respondidas",
    of: "de",
    quickExit: "Salida rápida",
    visibility:
      "Cuestionario identificado. Tus respuestas y resultados son privados. RR. HH. y los administradores no pueden leerlos.",
    history:
      "Puedes hacer una pausa antes de enviar. Los cuestionarios enviados se conservan en tu historial.",
    draftIntro: "Tu progreso se guarda después de cada respuesta.",
    savingDraft: "Guardando borrador…",
    savedDraft: "Borrador guardado. Puedes continuar más tarde.",
    failedDraft:
      "No se pudo guardar el borrador. Mantén esta página abierta y comprueba tu conexión.",
    choose: "Elige una respuesta",
    pause: "Pausar y volver",
    submit: "Enviar cuestionario",
    submitting: "Guardando tu cuestionario…",
    mySpace: "Mi espacio",
    organization: "Organización",
    careTeam: "Equipo de apoyo",
    sessions: "Sesiones",
    signOut: "Cerrar sesión",
  },
};
