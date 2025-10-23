
'use server';

interface CertbotParams {
  domain: string;
  email: string;
}

export async function getInstallCertbotNginxCommand({ domain, email }: CertbotParams): Promise<string> {
  if (!domain || !email) {
    throw new Error('Domain and email are required to generate an SSL certificate.');
  }

  // Sanitize inputs to prevent command injection, although they are used in a non-executable context here.
  const sanitizedDomain = domain.replace(/[^a-zA-Z0-9.-]/g, '');
  const sanitizedEmail = email.replace(/[^a-zA-Z0-9@.-]/g, '');

  return `
sudo apt-get update &&
sudo apt-get install -y certbot python3-certbot-nginx &&
sudo certbot --nginx --non-interactive --agree-tos --email ${sanitizedEmail} -d ${sanitizedDomain}
`.trim();
}
