import type { Locale } from "./locale";

/** Reviewed interface copy only. Assessment questions and source excerpts are
 * intentionally excluded: translating them does not validate an instrument. */
export const uiTranslations = {
  Home: ["Accueil", "Inicio"],
  "Care workspace": ["Espace de soutien", "Espacio de apoyo"],
  "Need-to-know access": [
    "Accès selon le besoin d’en connaître",
    "Acceso según necesidad",
  ],
  "Confidential care records": [
    "Dossiers de soutien confidentiels",
    "Expedientes de apoyo confidenciales",
  ],
  "This workspace only displays records your signed-in care role is permitted to access. Case notes are append-only, and every read or change is recorded for audit.":
    [
      "Cet espace affiche uniquement les dossiers autorisés pour votre rôle. Les notes ne peuvent pas être modifiées après ajout ; chaque lecture ou changement est journalisé.",
      "Este espacio muestra solo los expedientes permitidos para tu rol. Las notas no se modifican tras guardarse y cada lectura o cambio queda registrado.",
    ],
  "Go to sign in": ["Aller à la connexion", "Ir al acceso"],
  "Loading your permitted care workspace…": [
    "Chargement de votre espace autorisé…",
    "Cargando tu espacio autorizado…",
  ],
  "No confidential-care access is assigned": [
    "Aucun accès confidentiel attribué",
    "No tienes acceso confidencial asignado",
  ],
  "Your account does not currently hold a wellbeing-professional or safeguarding-officer role. Individual case records remain unavailable by design.":
    [
      "Votre compte ne dispose pas d’un rôle de professionnel du bien-être ou de responsable de protection. Les dossiers individuels restent inaccessibles.",
      "Tu cuenta no tiene el rol de profesional de bienestar ni de responsable de protección. Los expedientes individuales permanecen inaccesibles.",
    ],
  "Permitted cases": ["Dossiers autorisés", "Casos permitidos"],
  "Actual records only": [
    "Dossiers réels uniquement",
    "Solo expedientes reales",
  ],
  "No cases are currently available to your role in this organization. New cases will appear here once assigned through the protected workflow.":
    [
      "Aucun dossier n’est disponible pour votre rôle dans cette organisation. Les nouveaux dossiers apparaîtront après attribution par le parcours protégé.",
      "No hay casos disponibles para tu rol en esta organización. Aparecerán cuando se asignen mediante el proceso protegido.",
    ],
  Updated: ["Mis à jour", "Actualizado"],
  "Opening protected record…": [
    "Ouverture du dossier protégé…",
    "Abriendo expediente protegido…",
  ],
  priority: ["priorité", "prioridad"],
  "Case status": ["État du dossier", "Estado del caso"],
  "Last updated": ["Dernière modification", "Última actualización"],
  "Case notes": ["Notes du dossier", "Notas del caso"],
  "Notes are permanent once saved.": [
    "Les notes sont définitives une fois enregistrées.",
    "Las notas son permanentes una vez guardadas.",
  ],
  "No case notes have been added.": [
    "Aucune note ajoutée.",
    "No se han añadido notas.",
  ],
  Added: ["Ajouté", "Añadido"],
  "Add case note": ["Ajouter une note", "Añadir nota del caso"],
  "Add immutable note": [
    "Ajouter une note définitive",
    "Añadir nota inmutable",
  ],
  Referrals: ["Orientations", "Derivaciones"],
  "Saving a referral does not contact a provider.": [
    "Enregistrer une orientation ne contacte pas le prestataire.",
    "Guardar una derivación no contacta con un proveedor.",
  ],
  "New referral": ["Nouvelle orientation", "Nueva derivación"],
  "Referral type": ["Type d’orientation", "Tipo de derivación"],
  "Internal programme": ["Programme interne", "Programa interno"],
  "Internal specialist": ["Spécialiste interne", "Especialista interno"],
  "External EAP": [
    "Programme d’aide externe",
    "Programa de asistencia externo",
  ],
  "External clinical provider": [
    "Prestataire clinique externe",
    "Proveedor clínico externo",
  ],
  "Community support": ["Soutien communautaire", "Apoyo comunitario"],
  "Provider or destination": [
    "Prestataire ou destination",
    "Proveedor o destino",
  ],
  "Contact reference (optional)": [
    "Référence de contact (facultative)",
    "Referencia de contacto (opcional)",
  ],
  "Reason for referral": ["Motif de l’orientation", "Motivo de derivación"],
  "Save referral": ["Enregistrer l’orientation", "Guardar derivación"],
  Cancel: ["Annuler", "Cancelar"],
  "No referrals have been saved for this case.": [
    "Aucune orientation enregistrée pour ce dossier.",
    "No hay derivaciones guardadas para este caso.",
  ],
  "For an immediate safety concern, follow your organization’s safeguarding process or local emergency procedure. This record system does not replace emergency response.":
    [
      "En cas de danger immédiat, suivez la procédure de protection de votre organisation ou les procédures d’urgence locales. Ce système ne remplace pas les secours.",
      "Ante un peligro inmediato, sigue el protocolo de protección de tu organización o el procedimiento de emergencia local. Este sistema no sustituye a los servicios de emergencia.",
    ],
  "Select a permitted case": [
    "Sélectionnez un dossier autorisé",
    "Selecciona un caso permitido",
  ],
  "Select a case from the protected list to view its confidential workflow, notes, and referrals.":
    [
      "Sélectionnez un dossier dans la liste protégée pour consulter son suivi, ses notes et ses orientations.",
      "Selecciona un caso de la lista protegida para ver su seguimiento, notas y derivaciones.",
    ],
  "Safeguarding record": ["Dossier de protection", "Expediente de protección"],
  "Confidential wellbeing record": [
    "Dossier confidentiel de bien-être",
    "Expediente confidencial de bienestar",
  ],
  "The note was added to the immutable case history.": [
    "La note a été ajoutée à l’historique immuable.",
    "La nota se ha añadido al historial inmutable.",
  ],
  "Case status updated.": [
    "État du dossier mis à jour.",
    "Estado del caso actualizado.",
  ],
  "Referral status updated.": [
    "État de l’orientation mis à jour.",
    "Estado de derivación actualizado.",
  ],
  "Referral saved to the case workflow. No external provider was contacted automatically.":
    [
      "Orientation enregistrée. Aucun prestataire externe n’a été contacté automatiquement.",
      "Derivación guardada. No se ha contactado automáticamente con ningún proveedor externo.",
    ],
  "The secure care workflow is unavailable right now.": [
    "Le parcours sécurisé est indisponible actuellement.",
    "El proceso seguro no está disponible en este momento.",
  ],
  "Unable to load care records.": [
    "Impossible de charger les dossiers.",
    "No se pudieron cargar los expedientes.",
  ],
  "Unable to open this care record.": [
    "Impossible d’ouvrir ce dossier.",
    "No se pudo abrir este expediente.",
  ],
  "Unable to load your care access.": [
    "Impossible de charger votre accès.",
    "No se pudo cargar tu acceso.",
  ],
  "Unable to add the case note.": [
    "Impossible d’ajouter la note.",
    "No se pudo añadir la nota.",
  ],
  "Unable to update the case status.": [
    "Impossible de modifier l’état du dossier.",
    "No se pudo actualizar el estado del caso.",
  ],
  "Unable to create this referral.": [
    "Impossible de créer cette orientation.",
    "No se pudo crear esta derivación.",
  ],
  "Unable to update the referral status.": [
    "Impossible de modifier l’état de l’orientation.",
    "No se pudo actualizar el estado de derivación.",
  ],
  Open: ["Ouvert", "Abierto"],
  "In Review": ["En cours d’examen", "En revisión"],
  "Active Support": ["Soutien actif", "Apoyo activo"],
  Referred: ["Orienté", "Derivado"],
  Escalated: ["Transmis au niveau supérieur", "Escalado"],
  Resolved: ["Résolu", "Resuelto"],
  "Pending Review": ["En attente d’examen", "Pendiente de revisión"],
  Assigned: ["Attribué", "Asignado"],
  "In Progress": ["En cours", "En curso"],
  "Referred External": ["Orienté vers l’externe", "Derivado al exterior"],
  Declined: ["Refusé", "Rechazado"],
  Cancelled: ["Annulé", "Cancelado"],
  Routine: ["Courante", "Habitual"],
  Elevated: ["Élevée", "Elevada"],
  Urgent: ["Urgente", "Urgente"],
  Crisis: ["Crise", "Crisis"],
  "You are signed in as": [
    "Vous êtes connecté en tant que",
    "Has iniciado sesión como",
  ],
  "Open your staff workspace": [
    "Ouvrir votre espace professionnel",
    "Abrir tu espacio de personal",
  ],
  "Sign in": ["Se connecter", "Iniciar sesión"],
  "A little space for better care.": [
    "Un espace pour mieux prendre soin.",
    "Un espacio para cuidar mejor.",
  ],
  "Listen. Understand.": ["Écouter. Comprendre.", "Escuchar. Comprender."],
  "Care together.": ["Prendre soin ensemble.", "Cuidar juntos."],
  "Private wellbeing check-ins and practical follow-through for the people in your organization.":
    [
      "Des bilans privés de bien-être et un suivi concret pour les personnes de votre organisation.",
      "Cuestionarios privados de bienestar y seguimiento práctico para las personas de tu organización.",
    ],
  "Enter your care space": [
    "Entrer dans votre espace",
    "Entrar en tu espacio de apoyo",
  ],
  "For workplaces, schools, faith communities and learning groups.": [
    "Pour les entreprises, établissements, communautés de foi et groupes d’apprentissage.",
    "Para empresas, centros educativos, comunidades de fe y grupos de aprendizaje.",
  ],
  "Small check-ins.": ["De petits bilans.", "Pequeños cuestionarios."],
  "Thoughtful support.": ["Un soutien attentif.", "Apoyo atento."],
  "Check in at your own pace": [
    "Répondez à votre rythme",
    "Responde a tu ritmo",
  ],
  "Keep your personal results private": [
    "Gardez vos résultats privés",
    "Mantén privados tus resultados",
  ],
  "Connect with human care": [
    "Accédez à un soutien humain",
    "Conecta con apoyo humano",
  ],
  "How care works": ["Comment fonctionne le soutien", "Cómo funciona el apoyo"],
  "Your voice, your choice": ["Votre voix, votre choix", "Tu voz, tu elección"],
  "Choose whether to take part. Save your progress and come back when you are ready.":
    [
      "Choisissez de participer ou non. Enregistrez votre progression et revenez à votre rythme.",
      "Elige si quieres participar. Guarda tu progreso y vuelve cuando estés preparado.",
    ],
  "Clear privacy boundaries": [
    "Des limites de confidentialité claires",
    "Límites de privacidad claros",
  ],
  "Managers and HR do not receive your personal check-in answers or confidential care notes.":
    [
      "Les responsables et les RH ne reçoivent ni vos réponses personnelles ni les notes confidentielles.",
      "Los responsables y RR. HH. no reciben tus respuestas personales ni las notas confidenciales.",
    ],
  "People at the centre": [
    "La personne au centre",
    "Las personas en el centro",
  ],
  "Care professionals and facilitators manage support with human review and clear responsibilities.":
    [
      "Les professionnels et animateurs gèrent le soutien avec un examen humain et des responsabilités claires.",
      "Los profesionales y facilitadores gestionan el apoyo con revisión humana y responsabilidades claras.",
    ],
  "A few things to know before you begin": [
    "Quelques informations avant de commencer",
    "Información antes de empezar",
  ],
  "Your organization invitation determines your workspace access. Personal results are calculated from the check-in’s published scoring rules and are not a medical diagnosis.":
    [
      "L’invitation de votre organisation détermine votre accès. Les résultats personnels suivent les règles de calcul publiées et ne constituent pas un diagnostic médical.",
      "La invitación de tu organización determina el acceso. Los resultados se calculan con las reglas publicadas y no constituyen un diagnóstico médico.",
    ],
  "The resource assistant displays organization-reviewed excerpts with source links. It cannot provide emergency assistance. If you are in immediate danger, contact local emergency services or a healthcare professional.":
    [
      "L’assistant affiche des extraits examinés avec leurs sources. Il ne fournit pas d’aide d’urgence. En cas de danger immédiat, contactez les urgences locales ou un professionnel de santé.",
      "El asistente muestra extractos revisados y sus fuentes. No presta asistencia de emergencia. Si estás en peligro inmediato, contacta con emergencias locales o un profesional de salud.",
    ],
  "You can manage assessment consent and language preferences from your personal space. Withdrawing consent stops future submissions; it does not erase submitted history.":
    [
      "Gérez le consentement et la langue dans votre espace personnel. Le retrait du consentement bloque les prochains envois, sans effacer l’historique soumis.",
      "Gestiona el consentimiento y el idioma en tu espacio personal. Retirar el consentimiento impide nuevos envíos, pero no borra el historial enviado.",
    ],
  "Care with privacy and human judgement.": [
    "Un soutien confidentiel avec jugement humain.",
    "Apoyo con privacidad y criterio humano.",
  ],
  "Your invitation is needed": [
    "Votre invitation est nécessaire",
    "Necesitas una invitación",
  ],
  "You are signed in, but your email has no active organization access yet. Ask your organization administrator to invite this exact email address, then sign in again.":
    [
      "Vous êtes connecté, mais sans accès actif à une organisation. Demandez à l’administrateur d’inviter cette adresse e-mail exacte, puis reconnectez-vous.",
      "Has iniciado sesión, pero tu correo no tiene acceso activo a una organización. Pide al administrador que invite esta dirección exacta y vuelve a iniciar sesión.",
    ],
  "Return to sign in": ["Retour à la connexion", "Volver al acceso"],
  "Welcome to SWEEP Care": [
    "Bienvenue dans SWEEP Care",
    "Te damos la bienvenida a SWEEP Care",
  ],
  "Set up your organisation": [
    "Configurer votre organisation",
    "Configurar tu organización",
  ],
  "This takes about a minute. You will be the first organisation administrator and can invite others later.":
    [
      "Cela prend environ une minute. Vous serez le premier administrateur et pourrez inviter d’autres personnes ensuite.",
      "Tardarás aproximadamente un minuto. Serás el primer administrador y podrás invitar a otros después.",
    ],
  "Your name": ["Votre nom", "Tu nombre"],
  "Organisation name": ["Nom de l’organisation", "Nombre de la organización"],
  "Short address": ["Adresse courte", "Dirección corta"],
  "Lower-case letters, numbers, and hyphens only. Example: calm-harbour-school.":
    [
      "Lettres minuscules, chiffres et tirets uniquement. Exemple : calm-harbour-school.",
      "Solo letras minúsculas, números y guiones. Ejemplo: calm-harbour-school.",
    ],
  "Your sector": ["Votre secteur", "Tu sector"],
  "Workplace or organisation": [
    "Entreprise ou organisation",
    "Empresa u organización",
  ],
  "School or university": ["École ou université", "Escuela o universidad"],
  "Church or faith community": [
    "Église ou communauté de foi",
    "Iglesia o comunidad de fe",
  ],
  "Training provider or programme": [
    "Organisme ou programme de formation",
    "Entidad o programa de formación",
  ],
  "Saving your organisation…": [
    "Enregistrement de l’organisation…",
    "Guardando tu organización…",
  ],
  "Finish setup": ["Terminer la configuration", "Finalizar configuración"],
  "Your organization access could not be loaded. Please try again.": [
    "Votre accès n’a pas pu être chargé. Réessayez.",
    "No se pudo cargar tu acceso. Inténtalo de nuevo.",
  ],
  "Setup is temporarily unavailable. Please try again.": [
    "La configuration est temporairement indisponible. Réessayez.",
    "La configuración no está disponible temporalmente. Inténtalo de nuevo.",
  ],
  "We could not complete the setup. Check the details and try again.": [
    "Impossible de terminer la configuration. Vérifiez les informations et réessayez.",
    "No se pudo completar la configuración. Revisa los datos e inténtalo de nuevo.",
  ],
  "Checking your organization access…": [
    "Vérification de votre accès…",
    "Comprobando tu acceso…",
  ],
  "Organization-administrator access is required.": [
    "Un accès administrateur est nécessaire.",
    "Se requiere acceso de administrador.",
  ],
  "No enterprise identity or learning provider has been selected for this organization. Email sign-in remains available.":
    [
      "Aucun fournisseur d’identité ou d’apprentissage n’a été choisi. La connexion par e-mail reste disponible.",
      "No se ha elegido proveedor de identidad ni de aprendizaje. El acceso por correo sigue disponible.",
    ],
  "Not connected": ["Non connecté", "Sin conectar"],
  "Single sign-on (SAML)": [
    "Authentification unique (SAML)",
    "Inicio de sesión único (SAML)",
  ],
  "Directory provisioning (SCIM)": [
    "Provisionnement d’annuaire (SCIM)",
    "Aprovisionamiento de directorio (SCIM)",
  ],
  "Learning management system": [
    "Plateforme d’apprentissage",
    "Sistema de gestión del aprendizaje",
  ],
  "Inactive. Activation requires the identity provider’s metadata URL or signed metadata document, verified domains, a Supabase plan supporting SAML, and a live sign-in test.":
    [
      "Inactif. L’activation nécessite les métadonnées du fournisseur, des domaines vérifiés, une offre Supabase compatible SAML et un test de connexion réel.",
      "Inactivo. Se requieren metadatos del proveedor, dominios verificados, un plan Supabase compatible con SAML y una prueba real de acceso.",
    ],
  "Inactive. Activation requires a chosen directory provider, a narrowly scoped provisioning credential, role-mapping review, and tests for provisioning and deactivation.":
    [
      "Inactif. Un fournisseur d’annuaire, un identifiant à accès limité, un examen des rôles et des tests de création et désactivation sont nécessaires.",
      "Inactivo. Se requiere un proveedor de directorio, credenciales de alcance limitado, revisión de roles y pruebas de altas y desactivaciones.",
    ],
  "Inactive. Activation requires the LMS vendor, its base URL, a scoped API credential, the courses to synchronize, and an approved participant-data mapping.":
    [
      "Inactif. Le fournisseur, son URL, un identifiant API limité, les cours à synchroniser et une correspondance des données approuvée sont nécessaires.",
      "Inactivo. Se requiere el proveedor, su URL, credenciales API limitadas, los cursos y una correspondencia aprobada de datos de participantes.",
    ],
  "We could not complete that request": [
    "Impossible de terminer cette demande",
    "No se pudo completar la solicitud",
  ],
  "Your action may not have been saved. Check your connection and access, then try again.":
    [
      "Votre action n’a peut-être pas été enregistrée. Vérifiez votre connexion et votre accès, puis réessayez.",
      "Es posible que tu acción no se haya guardado. Comprueba la conexión y el acceso e inténtalo de nuevo.",
    ],
  "Try again": ["Réessayer", "Intentar de nuevo"],
  Language: ["Langue", "Idioma"],
  "Apply language": ["Appliquer la langue", "Aplicar idioma"],
  "Sign in securely": ["Connexion sécurisée", "Inicia sesión de forma segura"],
  "We will send a one-time link to your email. There is no password to remember.":
    [
      "Nous vous enverrons un lien à usage unique par e-mail. Aucun mot de passe à retenir.",
      "Te enviaremos un enlace de un solo uso por correo. No necesitas recordar una contraseña.",
    ],
  "Email address": ["Adresse e-mail", "Correo electrónico"],
  "Sending your link…": ["Envoi du lien…", "Enviando tu enlace…"],
  "Send secure sign-in link": [
    "Envoyer un lien de connexion sécurisé",
    "Enviar enlace de acceso seguro",
  ],
  "Return to SWEEP Care": ["Retour à SWEEP Care", "Volver a SWEEP Care"],
  "We could not send a sign-in link. Please check the address and try again.": [
    "Impossible d’envoyer le lien. Vérifiez l’adresse et réessayez.",
    "No se pudo enviar el enlace. Comprueba la dirección e inténtalo de nuevo.",
  ],
  "Your sign-in request was accepted. Check your inbox and spam folder for the one-time link. Your organization invitation determines workspace access.":
    [
      "Votre demande a été acceptée. Consultez votre boîte de réception et les indésirables. L’invitation de votre organisation détermine l’accès à votre espace.",
      "Tu solicitud se ha aceptado. Busca el enlace en tu bandeja de entrada y en correo no deseado. La invitación de tu organización determina el acceso.",
    ],
  "This sign-in link is expired or invalid. Request a new one below.": [
    "Ce lien est expiré ou invalide. Demandez-en un nouveau ci-dessous.",
    "Este enlace ha caducado o no es válido. Solicita uno nuevo.",
  ],
  "Your access could not be confirmed. Please try signing in again.": [
    "Votre accès n’a pas pu être confirmé. Essayez de vous reconnecter.",
    "No se pudo confirmar tu acceso. Intenta iniciar sesión de nuevo.",
  ],
  "Resource assistant": ["Assistant de ressources", "Asistente de recursos"],
  "A participant role is required to open this workspace.": [
    "Un rôle de participant est nécessaire pour ouvrir cet espace.",
    "Necesitas el rol de participante para abrir este espacio.",
  ],
  "Guided resource conversation": [
    "Conversation guidée sur les ressources",
    "Conversación guiada sobre recursos",
  ],
  "This automated assistant uses reviewed excerpts, not generated medical advice. Messages stay within SWEEP Care and are not sent to an external AI provider. Conversation text is kept only in this open page, not in the response audit.":
    [
      "Cet assistant utilise des extraits examinés, pas des conseils médicaux générés. Les messages restent dans SWEEP Care, sans envoi à un fournisseur d’IA externe. La conversation reste uniquement dans cette page ouverte, pas dans le journal des réponses.",
      "Este asistente utiliza extractos revisados, no consejos médicos generados. Los mensajes permanecen en SWEEP Care y no se envían a un proveedor externo de IA. La conversación se conserva solo en esta página abierta, no en el registro de respuestas.",
    ],
  Organization: ["Organisation", "Organización"],
  "What would you like resources about?": [
    "Sur quel sujet cherchez-vous des ressources ?",
    "¿Sobre qué tema buscas recursos?",
  ],
  "Finding reviewed resources…": [
    "Recherche de ressources examinées…",
    "Buscando recursos revisados…",
  ],
  "Send message": ["Envoyer le message", "Enviar mensaje"],
  "Unable to find resources. Please try again.": [
    "Impossible de trouver des ressources. Réessayez.",
    "No se pudieron buscar recursos. Inténtalo de nuevo.",
  ],
  "New conversation": ["Nouvelle conversation", "Nueva conversación"],
  "Tell me more": ["En savoir plus", "Dime más"],
  You: ["Vous", "Tú"],
  Assistant: ["Assistant", "Asistente"],
  "Original source text · not translated": [
    "Texte source original · non traduit",
    "Texto original · sin traducir",
  ],
  Approved: ["Approuvé", "Aprobado"],
  Source: ["Source", "Fuente"],
  Conversation: ["Conversation", "Conversación"],
  "Organization workspace": [
    "Espace de l’organisation",
    "Espacio de la organización",
  ],
  "This workspace requires an organization administrator or wellbeing professional role.":
    [
      "Cet espace nécessite un rôle d’administrateur ou de professionnel du bien-être.",
      "Este espacio requiere el rol de administrador o profesional de bienestar.",
    ],
  "Approved resources": ["Ressources approuvées", "Recursos aprobados"],
  "Enterprise connections": [
    "Connexions d’entreprise",
    "Conexiones empresariales",
  ],
  "Invite a member": ["Inviter un membre", "Invitar a un miembro"],
  "The invitation is bound to their verified email. Staff roles grant access to the named workflow; choose carefully.":
    [
      "L’invitation est liée à l’e-mail vérifié. Les rôles du personnel donnent accès aux fonctions correspondantes ; choisissez avec soin.",
      "La invitación está vinculada al correo verificado. Los roles del personal dan acceso a sus funciones; elige con cuidado.",
    ],
  Email: ["E-mail", "Correo"],
  Role: ["Rôle", "Rol"],
  "Save invitation and request email": [
    "Enregistrer l’invitation et demander l’e-mail",
    "Guardar invitación y solicitar correo",
  ],
  Members: ["Membres", "Miembros"],
  "Active access": ["Accès actif", "Acceso activo"],
  "Update access": ["Mettre à jour l’accès", "Actualizar acceso"],
  Invitations: ["Invitations", "Invitaciones"],
  Accepted: ["Acceptée", "Aceptada"],
  Expired: ["Expirée", "Caducada"],
  "Awaiting acceptance": [
    "En attente d’acceptation",
    "Pendiente de aceptación",
  ],
  "No invitations yet.": [
    "Aucune invitation pour le moment.",
    "Todavía no hay invitaciones.",
  ],
  "Published campaigns": ["Campagnes publiées", "Campañas publicadas"],
  Closes: ["Clôture", "Cierre"],
  "Create your first reviewed check-in above.": [
    "Créez votre premier bilan examiné ci-dessus.",
    "Crea tu primer cuestionario revisado arriba.",
  ],
  "Invitation saved. The email provider accepted the sign-in request; delivery is not yet confirmed.":
    [
      "Invitation enregistrée. Le fournisseur a accepté la demande de connexion ; la réception n’est pas encore confirmée.",
      "Invitación guardada. El proveedor aceptó la solicitud de acceso; la entrega aún no está confirmada.",
    ],
  "Invitation saved, but the sign-in email could not be sent. Share the sign-in page with the invitee and retry when email service is available.":
    [
      "Invitation enregistrée, mais l’e-mail n’a pas pu être envoyé. Partagez la page de connexion et réessayez lorsque le service sera disponible.",
      "Invitación guardada, pero no se pudo enviar el correo. Comparte la página de acceso e inténtalo cuando el servicio esté disponible.",
    ],
  Participant: ["Participant", "Participante"],
  "Organization administrator": [
    "Administrateur de l’organisation",
    "Administrador de la organización",
  ],
  "Wellbeing professional": [
    "Professionnel du bien-être",
    "Profesional de bienestar",
  ],
  "Safeguarding officer": [
    "Responsable de protection",
    "Responsable de protección",
  ],
  "HR manager": ["Responsable RH", "Responsable de RR. HH."],
  "Trainer / facilitator": ["Formateur / animateur", "Formador / facilitador"],
  "Programme sessions": ["Séances du programme", "Sesiones del programa"],
  "You need a facilitator, professional, or organization-administrator role.": [
    "Un rôle d’animateur, de professionnel ou d’administrateur est nécessaire.",
    "Necesitas el rol de facilitador, profesional o administrador.",
  ],
  "Facilitators see their assigned approved sessions and attendance records. Personal assessment answers and care notes are not included.":
    [
      "Les animateurs voient leurs séances approuvées et les présences. Les réponses personnelles et notes de soutien ne sont pas incluses.",
      "Los facilitadores ven sus sesiones aprobadas y las asistencias. No se incluyen respuestas personales ni notas de apoyo.",
    ],
  "Prepare a session": ["Préparer une séance", "Preparar una sesión"],
  Title: ["Titre", "Título"],
  Facilitator: ["Animateur", "Facilitador"],
  "Select an active facilitator": [
    "Sélectionnez un animateur actif",
    "Selecciona un facilitador activo",
  ],
  "Scheduled time": ["Date et heure prévues", "Fecha y hora programadas"],
  "Reviewed session materials": [
    "Supports de séance examinés",
    "Materiales de sesión revisados",
  ],
  "Save session for review": [
    "Enregistrer pour examen",
    "Guardar para revisión",
  ],
  "Approve reviewed session": [
    "Approuver la séance examinée",
    "Aprobar la sesión revisada",
  ],
  "Participant to enroll": [
    "Participant à inscrire",
    "Participante que inscribir",
  ],
  "Enroll a participant": [
    "Inscrire un participant",
    "Inscribir a un participante",
  ],
  Enroll: ["Inscrire", "Inscribir"],
  Attendance: ["Présences", "Asistencia"],
  Present: ["Présent", "Presente"],
  "Not marked present": ["Présence non confirmée", "Sin marcar como presente"],
  "Mark absent": ["Marquer absent", "Marcar ausente"],
  "Mark present": ["Marquer présent", "Marcar presente"],
  "Mark session completed": [
    "Marquer la séance terminée",
    "Marcar sesión completada",
  ],
  "No sessions are available to your role yet.": [
    "Aucune séance disponible pour votre rôle.",
    "Todavía no hay sesiones disponibles para tu rol.",
  ],
  Draft: ["Brouillon", "Borrador"],
  Completed: ["Terminée", "Completada"],
  Active: ["Active", "Activa"],
  Closed: ["Fermée", "Cerrada"],
  Scheduled: ["Planifiée", "Programada"],
  "Publish a custom check-in": [
    "Publier un bilan personnalisé",
    "Publicar un cuestionario personalizado",
  ],
  "Enter your own reviewed questions. This creates an immutable instrument and an identified campaign for the organization’s participants. Custom scores are non-diagnostic.":
    [
      "Saisissez vos questions examinées. Cela crée un instrument immuable et une campagne identifiée pour les participants. Les scores personnalisés ne sont pas diagnostiques.",
      "Introduce tus preguntas revisadas. Se creará un instrumento inmutable y una campaña identificada para los participantes. Las puntuaciones personalizadas no son diagnósticas.",
    ],
  "Participant introduction": [
    "Introduction pour les participants",
    "Introducción para participantes",
  ],
  "Closes at (your local time)": [
    "Clôture (heure locale)",
    "Cierre (tu hora local)",
  ],
  Question: ["Question", "Pregunta"],
  "Question text": ["Texte de la question", "Texto de la pregunta"],
  "Domain name": ["Nom du domaine", "Nombre del ámbito"],
  Minimum: ["Minimum", "Mínimo"],
  Maximum: ["Maximum", "Máximo"],
  "Reverse scoring: lower answers contribute higher scores": [
    "Calcul inversé : les réponses basses contribuent à des scores plus élevés",
    "Puntuación inversa: las respuestas bajas contribuyen a puntuaciones más altas",
  ],
  "Remove question": ["Supprimer la question", "Quitar pregunta"],
  "Add question": ["Ajouter une question", "Añadir pregunta"],
  "Publishing…": ["Publication…", "Publicando…"],
  "Publish and open campaign": [
    "Publier et ouvrir la campagne",
    "Publicar y abrir campaña",
  ],
  "Check-in published and available to adult participants with consent.": [
    "Bilan publié et disponible pour les participants adultes ayant consenti.",
    "Cuestionario publicado y disponible para adultos que hayan dado su consentimiento.",
  ],
  "Unable to publish. Check every question, domain, scale and closing date.": [
    "Publication impossible. Vérifiez les questions, domaines, échelles et la date de clôture.",
    "No se pudo publicar. Revisa las preguntas, ámbitos, escalas y fecha de cierre.",
  ],
  "Resource-review access is required.": [
    "Un accès à l’examen des ressources est nécessaire.",
    "Se requiere acceso para revisar recursos.",
  ],
  "Review and add a source": [
    "Examiner et ajouter une source",
    "Revisar y añadir una fuente",
  ],
  "Only add content you have reviewed and have permission to share. The assistant displays your exact excerpt with its source link. It does not infer additional claims.":
    [
      "Ajoutez uniquement du contenu examiné que vous avez le droit de partager. L’assistant affiche l’extrait exact avec son lien, sans ajouter d’affirmations.",
      "Añade solo contenido revisado que tengas permiso para compartir. El asistente muestra el extracto exacto y su enlace, sin inferir otras afirmaciones.",
    ],
  "Original source URL": [
    "URL de la source originale",
    "URL de la fuente original",
  ],
  "Approved excerpt": ["Extrait approuvé", "Extracto aprobado"],
  "Topic tags": ["Mots-clés", "Etiquetas del tema"],
  "For example: sleep, work, stress": [
    "Par exemple : sommeil, travail, stress",
    "Por ejemplo: sueño, trabajo, estrés",
  ],
  "I have reviewed this source and approve this excerpt for participants.": [
    "J’ai examiné cette source et j’approuve cet extrait pour les participants.",
    "He revisado esta fuente y apruebo este extracto para los participantes.",
  ],
  "Approve and add resource": [
    "Approuver et ajouter la ressource",
    "Aprobar y añadir recurso",
  ],
  "No organization resources are approved yet.": [
    "Aucune ressource de l’organisation n’est encore approuvée.",
    "Todavía no hay recursos aprobados de la organización.",
  ],
  "Participant check-in": [
    "Bilan du participant",
    "Cuestionario del participante",
  ],
  "This check-in requires a participant account in the organization.": [
    "Ce bilan nécessite un compte de participant dans l’organisation.",
    "Este cuestionario requiere una cuenta de participante en la organización.",
  ],
  "Before your check-in": ["Avant votre bilan", "Antes de tu cuestionario"],
  "Complete your participant profile and make your consent choice before starting.":
    [
      "Complétez votre profil et choisissez votre consentement avant de commencer.",
      "Completa tu perfil y decide sobre el consentimiento antes de empezar.",
    ],
  "Open profile and consent": [
    "Ouvrir le profil et le consentement",
    "Abrir perfil y consentimiento",
  ],
  "Check-in unavailable": ["Bilan indisponible", "Cuestionario no disponible"],
  "This check-in is not currently open in the supported identified campaign mode.":
    [
      "Ce bilan n’est pas ouvert dans le mode de campagne identifiée pris en charge.",
      "Este cuestionario no está abierto en el modo de campaña identificada disponible.",
    ],
  "Unable to submit. Please check your connection, consent and campaign availability.":
    [
      "Envoi impossible. Vérifiez votre connexion, votre consentement et la disponibilité du bilan.",
      "No se pudo enviar. Comprueba tu conexión, consentimiento y disponibilidad del cuestionario.",
    ],
  Reports: ["Rapports", "Informes"],
  "Reports are not available yet.": [
    "Les rapports ne sont pas encore disponibles.",
    "Los informes todavía no están disponibles.",
  ],
  "No verified population report is connected to this screen. Sample figures and simulated exports have been removed. Your organization’s individual answers are not displayed here.":
    [
      "Aucun rapport de population vérifié n’est connecté à cet écran. Les chiffres d’exemple et exports simulés ont été supprimés. Les réponses individuelles ne sont pas affichées ici.",
      "No hay ningún informe de población verificado conectado a esta pantalla. Se han eliminado los datos de ejemplo y las exportaciones simuladas. Aquí no se muestran respuestas individuales.",
    ],
  "Return to my space": ["Retour à mon espace", "Volver a mi espacio"],
} as const satisfies Record<string, readonly [string, string]>;

export type UiPhrase = keyof typeof uiTranslations;
export function uiText(locale: Locale) {
  return (phrase: UiPhrase): string =>
    locale === "en" ? phrase : uiTranslations[phrase][locale === "fr" ? 0 : 1];
}

const rolePhrases: Record<string, UiPhrase> = {
  PARTICIPANT: "Participant",
  ORG_ADMIN: "Organization administrator",
  WELLBEING_PROFESSIONAL: "Wellbeing professional",
  SAFEGUARDING_OFFICER: "Safeguarding officer",
  HR_MANAGER: "HR manager",
  TRAINER_FACILITATOR: "Trainer / facilitator",
};
export function roleLabel(role: string, locale: Locale) {
  const phrase = rolePhrases[role];
  return phrase ? uiText(locale)(phrase) : role.replaceAll("_", " ");
}

export function workflowLabel(status: string, locale: Locale) {
  const phrases: Record<string, UiPhrase> = {
    DRAFT: "Draft",
    APPROVED: "Approved",
    COMPLETED: "Completed",
    ACTIVE: "Active",
    CLOSED: "Closed",
    SCHEDULED: "Scheduled",
  };
  return phrases[status] ? uiText(locale)(phrases[status]) : status;
}
