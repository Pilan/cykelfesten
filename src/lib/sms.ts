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

export async function sendAdvanceSms(
  phone: string,
  date: string,
  course: 'starter' | 'main' | 'dessert',
  time: string,
  guestCount: number,
  dietaryList: string[]
): Promise<void> {
  let message =
    `[Cykelfesten ${date}] Du/ni serverar ${courseLabel(course)} hemma kl ${time}. ` +
    `Ni tar emot ${guestCount} gästpersoner.`;
  if (dietaryList.length > 0) {
    message += ` Specialkost bland gästerna (${dietaryList.length} st): ${dietaryList.join(', ')}.`;
  }
  message += ' Mer info kommer dagen för festen!';
  await sendSms(phone, message);
}

export async function sendHostSms(
  phone: string,
  course: 'starter' | 'main' | 'dessert',
  time: string
): Promise<void> {
  const message =
    `[Cykelfesten] Du/ni är hemma och tar emot gäster för ${courseLabel(course)} kl ${time}. Välkommen!`;
  await sendSms(phone, message);
}

export async function sendGuestSms(
  phone: string,
  course: 'starter' | 'main' | 'dessert',
  hostAddress: string,
  time: string
): Promise<void> {
  const message =
    `[Cykelfesten] Cykla till ${hostAddress} för ${courseLabel(course)} kl ${time}!`;
  await sendSms(phone, message);
}
