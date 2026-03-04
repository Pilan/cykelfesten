import { Resend } from 'resend';
import type { Event, Household } from './types';

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

let resend: Resend | null = null;

function getResend(): Resend {
  if (!resend) {
    resend = new Resend(process.env.RESEND_API_KEY);
  }
  return resend;
}

export async function sendConfirmationEmail(
  event: Event,
  household: Household
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

  if (!apiKey || !from) {
    console.log('\n📧 [EMAIL FALLBACK – skickas ej, loggas istället]');
    console.log(`Till:     ${household.email}`);
    console.log(`Ämne:     Anmälningsbekräftelse – ${event.title}`);
    console.log(`Datum:    ${eventDate}`);
    console.log(`Anmälda: ${members.join(', ')}`);
    console.log(`Adress:   ${household.address}`);
    console.log(`Platser:  ${household.capacity}`);
    if (household.dietary) console.log(`Kost:     ${household.dietary}`);
    console.log('──────────────────────────────────────\n');
    return;
  }

  const html = `
<!DOCTYPE html>
<html lang="sv">
<head><meta charset="UTF-8"><title>Anmälningsbekräftelse – ${event.title}</title></head>
<body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
  <h1 style="color: #16a34a;">🚴 Cykelfesten</h1>
  <h2>${event.title}</h2>
  <p>Tack för er anmälan! Här är en sammanfattning:</p>
  <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
    <tr style="border-bottom: 1px solid #e5e7eb;">
      <td style="padding: 8px; font-weight: bold; width: 40%;">Datum</td>
      <td style="padding: 8px;">${eventDate}</td>
    </tr>
    <tr style="border-bottom: 1px solid #e5e7eb; background: #f9fafb;">
      <td style="padding: 8px; font-weight: bold;">Plats</td>
      <td style="padding: 8px;">${event.location || '–'}</td>
    </tr>
    <tr style="border-bottom: 1px solid #e5e7eb;">
      <td style="padding: 8px; font-weight: bold;">Anmälda</td>
      <td style="padding: 8px;">${members.join(', ')}</td>
    </tr>
    <tr style="border-bottom: 1px solid #e5e7eb; background: #f9fafb;">
      <td style="padding: 8px; font-weight: bold;">Er adress</td>
      <td style="padding: 8px;">${household.address}</td>
    </tr>
    <tr style="border-bottom: 1px solid #e5e7eb;">
      <td style="padding: 8px; font-weight: bold;">Extra platser</td>
      <td style="padding: 8px;">${household.capacity} gäster</td>
    </tr>
    ${household.dietary ? `
    <tr style="border-bottom: 1px solid #e5e7eb; background: #f9fafb;">
      <td style="padding: 8px; font-weight: bold;">Specialkost</td>
      <td style="padding: 8px;">${household.dietary}</td>
    </tr>` : ''}
  </table>
  <p style="color: #6b7280; font-size: 14px;">
    Vi återkommer med mer information om vilken rätt ni serverar och vilka hushåll ni besöker.
  </p>
  <p style="color: #6b7280; font-size: 14px;">Välkommen på cykelfest! 🚴‍♀️</p>
</body>
</html>`;

  const result = await getResend().emails.send({
    from,
    to: household.email,
    subject: `Anmälningsbekräftelse – ${event.title}`,
    html,
  });
  if (result.error) {
    console.error('Resend error:', result.error);
    throw new Error(result.error.message);
  }
  console.log('📧 Mail skickat via Resend, id:', result.data?.id);
}
