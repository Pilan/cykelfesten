const API_URL = 'https://api.46elks.com/a1/sms';

async function sendSms(to: string, message: string): Promise<void> {
  const username = process.env.FORTYSIX_ELKS_API_USERNAME;
  const password = process.env.FORTYSIX_ELKS_API_PASSWORD;
  const from = process.env.FORTYSIX_ELKS_FROM || 'Cykelfest';

  if (!username || !password) {
    console.warn('46elks credentials not configured, skipping SMS:', to, message);
    return;
  }

  const body = new URLSearchParams({ from, to, message });
  const res = await fetch(API_URL, {
    method: 'POST',
    headers: {
      Authorization: 'Basic ' + Buffer.from(`${username}:${password}`).toString('base64'),
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: body.toString(),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`46elks error ${res.status}: ${text}`);
  }
}

function courseLabel(course: 'starter' | 'main' | 'dessert'): string {
  return { starter: 'förrätt', main: 'varmrätt', dessert: 'dessert' }[course];
}

function interpolate(template: string, vars: Record<string, string>): string {
  return template.replace(/\{\{([^}]+)\}\}/g, (_, key) => vars[key.trim()] ?? '');
}

export async function sendAdvanceSms(
  phone: string,
  date: string,
  course: 'starter' | 'main' | 'dessert',
  time: string,
  guestCount: number,
  dietaryList: string[],
  template: string
): Promise<void> {
  const specialkost =
    dietaryList.length > 0
      ? ` Specialkost bland gästerna (${dietaryList.length} st): ${dietaryList.join(', ')}.`
      : '';
  const message = interpolate(template, {
    datum: date,
    rätt: courseLabel(course),
    tid: time,
    antal_gäster: String(guestCount),
    specialkost,
  });
  await sendSms(phone, message);
}

export async function sendHostSms(
  phone: string,
  course: 'starter' | 'main' | 'dessert',
  time: string,
  template: string
): Promise<void> {
  const message = interpolate(template, {
    rätt: courseLabel(course),
    tid: time,
  });
  await sendSms(phone, message);
}

export async function sendGuestSms(
  phone: string,
  course: 'starter' | 'main' | 'dessert',
  hostAddress: string,
  time: string,
  template: string
): Promise<void> {
  const message = interpolate(template, {
    rätt: courseLabel(course),
    adress: hostAddress,
    tid: time,
  });
  await sendSms(phone, message);
}
