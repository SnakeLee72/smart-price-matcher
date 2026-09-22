function validateProductionEnv(env) {
  const issues = [];
  const required = (key, minLength = 1) => {
    const value = env[key] || '';
    if (value.length < minLength) issues.push(`${key} must contain at least ${minLength} characters`);
    return value;
  };
  const appUrl = required('NEXTAUTH_URL');
  const publicUrl = required('NEXT_PUBLIC_APP_URL');
  const secret = required('NEXTAUTH_SECRET', 32);
  const adminToken = required('ADMIN_API_TOKEN', 32);
  const databaseUrl = required('DATABASE_URL');
  for (const [name, value] of [['NEXTAUTH_URL', appUrl], ['NEXT_PUBLIC_APP_URL', publicUrl]]) {
    try {
      const parsed = new URL(value);
      if (parsed.protocol !== 'https:' || parsed.username || parsed.password) issues.push(`${name} must be a public HTTPS URL`);
    } catch { issues.push(`${name} must be a valid URL`); }
  }
  if (appUrl !== publicUrl) issues.push('NEXTAUTH_URL and NEXT_PUBLIC_APP_URL must match');
  if (secret && secret === adminToken) issues.push('NEXTAUTH_SECRET and ADMIN_API_TOKEN must differ');
  try {
    const parsed = new URL(databaseUrl);
    if (!['postgresql:', 'postgres:'].includes(parsed.protocol)) issues.push('DATABASE_URL must use PostgreSQL');
    if (!['require', 'verify-ca', 'verify-full'].includes(parsed.searchParams.get('sslmode') || '')) issues.push('DATABASE_URL must require TLS (sslmode=require or stronger)');
    if (parsed.username === 'postgres' && parsed.password === 'postgres') issues.push('DATABASE_URL uses the sample database credentials');
  } catch { issues.push('DATABASE_URL must be a valid PostgreSQL URL'); }
  if (env.ENABLE_PRICE_PERSISTENCE !== 'true') issues.push('ENABLE_PRICE_PERSISTENCE must be true');
  if (env.ENABLE_CONNECTOR_LOGS !== 'true') issues.push('ENABLE_CONNECTOR_LOGS must be true');
  for (const [id, key] of [['GOOGLE_CLIENT_ID', 'GOOGLE_CLIENT_SECRET'], ['MICROSOFT_ENTRA_ID_CLIENT_ID', 'MICROSOFT_ENTRA_ID_CLIENT_SECRET']]) {
    if (Boolean(env[id]) !== Boolean(env[key])) issues.push(`${id} and ${key} must be configured together`);
  }
  return issues;
}

if (require.main === module) {
  const issues = validateProductionEnv(process.env);
  if (issues.length) {
    console.error('Production preflight failed:\n' + issues.map((issue) => `- ${issue}`).join('\n'));
    process.exit(1);
  }
  console.log('Production preflight passed');
}

module.exports = { validateProductionEnv };
