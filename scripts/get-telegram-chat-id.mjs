import { readFile } from 'node:fs/promises';

async function main() {
  const envText = await readFile(new URL('../.env', import.meta.url), 'utf8');
  const tokenLine = envText.split(/\r?\n/).find((line) => /^\s*TELEGRAM_BOT_TOKEN\s*=/.test(line));
  const token = tokenLine?.split('=').slice(1).join('=').trim().replace(/^['"]|['"]$/g, '');
  if (!token || token.startsWith('replace-')) {
    throw new Error('Add TELEGRAM_BOT_TOKEN to .env first.');
  }

  const response = await fetch(`https://api.telegram.org/bot${token}/getUpdates?limit=100`, {
    signal: AbortSignal.timeout(10000),
  });
  const data = await response.json();
  if (!response.ok || data.ok !== true) {
    throw new Error('Telegram could not return updates. If this bot uses a webhook, getUpdates is unavailable.');
  }
  const groups = new Map();
  for (const update of data.result) {
    const chat = update.message?.chat ?? update.my_chat_member?.chat;
    if (chat && (chat.type === 'group' || chat.type === 'supergroup')) {
      groups.set(chat.id, chat.title ?? '(untitled group)');
    }
  }
  if (groups.size === 0) {
    console.log('No group found. Add the bot to your group, send /id@YourBotUsername in that group, then run this again.');
    return;
  }
  for (const [id, title] of groups) console.log(`${title}: ${id}`);
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
