import { Resend } from 'resend';
import type { Event, Household } from './types';

let resend: Resend | null = null;

function getResend(): Resend {
  if (!resend) {
    resend = new Resend(process.env.RESEND_API_KEY);
  }
  return resend;
}

function interpolate(template: string, vars: Record<string, string>): string {
  return template.replace(/\{\{([^}]+)\}\}/g, (_, key) => vars[key.trim()] ?? '');
}

function textToHtml(text: string): string {
  return `<!DOCTYPE html>
<html lang="sv">
<head><meta charset="UTF-8"></head>
<body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333; line-height: 1.6;">
${text
  .split('\n')
  .map((line) => (line.trim() ? `<p style="margin: 4px 0;">${line}</p>` : '<br>'))
  .join('\n')}
</body>
</html>`;
}

export async function sendVerificationEmail(email: string, link: string): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL;

  if (!apiKey || !from) {
    console.log('\n📧 [EMAIL FALLBACK – skickas ej, loggas istället]');
    console.log(`Till:  ${email}`);
    console.log(`Länk:  ${link}`);
    console.log('──────────────────────────────────────\n');
    return;
  }

  const html = `
<!DOCTYPE html>
<html lang="sv">
<head><meta charset="UTF-8"><title>Verifiera din e-post – Cykelfesten</title></head>
<body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
  <h1 style="color: #16a34a;">🚴 Cykelfesten</h1>
  <h2>Verifiera din e-postadress</h2>
  <p>Klicka på knappen nedan för att sätta ditt lösenord och aktivera ditt konto.</p>
  <p style="margin: 24px 0;">
    <a href="${link}" style="background: #16a34a; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold;">
      Aktivera konto
    </a>
  </p>
  <p style="color: #6b7280; font-size: 14px;">Länken är giltig i 24 timmar. Om du inte begärde detta kan du ignorera detta mail.</p>
</body>
</html>`;

  const result = await getResend().emails.send({
    from,
    to: email,
    subject: 'Verifiera din e-post – Cykelfesten',
    html,
  });
  if (result.error) {
    console.error('Resend error:', result.error);
    console.log('\n📧 [EMAIL FALLBACK – Resend misslyckades, loggar länken istället]');
    console.log(`Till:  ${email}`);
    console.log(`Länk:  ${link}`);
    console.log('──────────────────────────────────────\n');
    return;
  }
  console.log('📧 Verifieringsmail skickat via Resend, id:', result.data?.id);
}

export async function sendConfirmationEmail(
  event: Event,
  household: Household,
  subjectTemplate: string,
  bodyTemplate: string
): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL;

  const members: string[] = JSON.parse(household.members);
  const eventDate = new Date(event.date).toLocaleDateString('sv-SE', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const vars: Record<string, string> = {
    event_titel: event.title,
    datum: eventDate,
    plats: event.location || '–',
    namn: members.join(', '),
    adress: household.address,
    platser: String(household.capacity),
    specialkost: household.dietary ? `\nSpecialkost: ${household.dietary}` : '',
  };

  const subject = interpolate(subjectTemplate, vars);
  const body = interpolate(bodyTemplate, vars);

  if (!apiKey || !from) {
    console.log('\n📧 [EMAIL FALLBACK – skickas ej, loggas istället]');
    console.log(`Till:  ${household.email}`);
    console.log(`Ämne:  ${subject}`);
    console.log(body);
    console.log('──────────────────────────────────────\n');
    return;
  }

  const result = await getResend().emails.send({
    from,
    to: household.email,
    subject,
    html: textToHtml(body),
  });
  if (result.error) {
    console.error('Resend error:', result.error);
    throw new Error(result.error.message);
  }
  console.log('📧 Mail skickat via Resend, id:', result.data?.id);
}
