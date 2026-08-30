"use server";

import crypto from "crypto";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { sendMail } from "@/lib/mail";
import { HALL_NAME } from "@/lib/config";

const schema = z.object({ email: z.email() });

export type ForgotPasswordState = { message?: string; error?: string } | undefined;

export async function requestPasswordReset(
  _prev: ForgotPasswordState,
  formData: FormData
): Promise<ForgotPasswordState> {
  const parsed = schema.safeParse({ email: formData.get("email") });
  if (!parsed.success) {
    return { error: "Vnesi veljaven e-poštni naslov." };
  }

  const user = await prisma.user.findUnique({ where: { email: parsed.data.email } });
  if (user) {
    const token = crypto.randomBytes(32).toString("hex");
    await prisma.passwordResetToken.deleteMany({ where: { userId: user.id } });
    await prisma.passwordResetToken.create({
      data: { token, userId: user.id, expiresAt: new Date(Date.now() + 60 * 60 * 1000) },
    });
    const url = `${process.env.AUTH_URL}/ponastavi-geslo/${token}`;
    await sendMail(
      user.email,
      "Ponastavitev gesla",
      `Pozdravljen(a) ${user.name},\n\nZa ponastavitev gesla klikni na spodnjo povezavo (velja 1 uro):\n${url}\n\nČe tega nisi zahteval(a), to e-pošto preprosto ignoriraj - tvoje geslo ostane nespremenjeno.\n\nLep pozdrav,\n${HALL_NAME}`
    );
  }

  // Same message whether or not the account exists - don't leak who's registered.
  return {
    message: "Če račun s tem e-poštnim naslovom obstaja, smo nanj poslali povezavo za ponastavitev gesla.",
  };
}
