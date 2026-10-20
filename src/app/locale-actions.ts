"use server";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { z } from "zod";
export async function changeLanguage(form: FormData) {
  const locale = z.enum(["en", "fr", "es"]).parse(form.get("locale"));
  (await cookies()).set("sweep-locale", locale, {
    path: "/",
    sameSite: "lax",
    maxAge: 31536000,
    secure: process.env.NODE_ENV === "production",
  });
  revalidatePath("/", "layout");
}
