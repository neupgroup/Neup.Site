const profilePaths: Record<string, (username: string) => string> = {
  instagram: (username) => `https://instagram.com/${username}`,
  facebook: (username) => `https://facebook.com/${username}`,
  discord: (username) => `https://discord.com/users/${username}`,
  youtube: (username) => `https://youtube.com/${username.startsWith('@') ? username : `@${username}`}`,
  twitter: (username) => `https://twitter.com/${username}`,
  tiktok: (username) => `https://tiktok.com/${username.startsWith('@') ? username : `@${username}`}`,
  github: (username) => `https://github.com/${username}`,
  threads: (username) => `https://threads.com/${username.startsWith('@') ? username : `@${username}`}`,
  linkedin: (username) => `https://linkedin.com/in/${username}`,
  snapchat: (username) => `https://snapchat.com/add/${username}`,
  telegram: (username) => `https://t.me/${username}`,
  whatsapp: (username) => `https://wa.me/${username}`,
  wechat: (username) => `https://weixin.qq.com/r/${username}`,
  pinterest: (username) => `https://pinterest.com/${username}`,
  bereal: (username) => `https://bere.al/${username}`,
  dribbble: (username) => `https://dribbble.com/${username}`,
  twitch: (username) => `https://twitch.tv/${username}`,
  behance: (username) => `https://behance.net/${username}`,
  flickr: (username) => `https://flickr.com/people/${username}`,
  quora: (username) => `https://quora.com/profile/${username}`,
  reddit: (username) => `https://reddit.com/users/${username}`,
  goodreads: (username) => `https://goodreads.com/user/show/${username}`,
  vk: (username) => `https://vk.com/${username}`,
  myspace: (username) => `https://myspace.com/${username}`,
  zoom: (username) => `https://zoom.us/profile/${username}`,
  tripadvisor: (username) => `https://tripadvisor.com/Profile/${username}`,
  bluesky: (username) => `https://bsky.app/profile/${username}`,
  stackoverflow: (username) => `https://stackoverflow.com/users/${username}`,
  medium: (username) => `https://medium.com/${username.startsWith('@') ? username : `@${username}`}`,
  wattpad: (username) => `https://wattpad.com/user/${username}`,
};

const platformsWithAtUsernames = new Set(['youtube', 'threads', 'tiktok', 'medium']);

export function getSocialProfileUrl(platformName: string, usernameOrUrl: string): string {
  const key = platformName.toLowerCase().replace(/[^a-z0-9]/g, '');
  const value = usernameOrUrl.trim();
  if (/^https?:\/\//i.test(value)) return value;
  if (key === 'linkedin' && /^\/in\//i.test(value)) return `https://linkedin.com${value}`;
  if (key === 'linkedin' && /^company\//i.test(value)) return `https://linkedin.com/${value}`;
  const buildUrl = profilePaths[key];
  if (!buildUrl) return value;
  const username = platformsWithAtUsernames.has(key)
    ? (value.startsWith('@') ? value : `@${value}`)
    : value.replace(/^@/, '');
  return buildUrl(username);
}
