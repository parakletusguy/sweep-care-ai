import { cookies } from "next/headers";
import { parseLocale } from "./locale";
import { uiText } from "./ui-copy";
export async function serverLocale() {
  const locale = parseLocale((await cookies()).get("sweep-locale")?.value);
  return { locale, t: uiText(locale) };
}
