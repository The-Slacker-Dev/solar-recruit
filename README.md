# Solar Recruit: Telegram lead delivery

The form sends applications to the Vercel function at `/api/apply`. The function
delivers a message to your private Telegram group and confirms success only when
Telegram accepts it.

## Set up your group

1. Add your bot to the private Telegram group. Give it permission to post messages.
2. Put `TELEGRAM_BOT_TOKEN=...` in the local `.env` file. Do not commit or share this file.
3. In the group, send `/id@YourBotUsername` (replace the username with your bot's).
4. Run `node scripts/get-telegram-chat-id.mjs`. Copy the ID beside your group's title.
5. Put `TELEGRAM_CHAT_ID=...` in the local `.env` file. Group IDs are often negative.

If the helper reports that `getUpdates` is unavailable, another application has
configured a Telegram webhook for this bot. Obtain the chat ID from that application's
updates rather than deleting its webhook.

## Set up Vercel

1. Import this directory as a Vercel project with **Other** as the framework preset.
2. In **Project Settings → Environment Variables**, add `TELEGRAM_BOT_TOKEN` and
   `TELEGRAM_CHAT_ID` using the values from `.env`. Select **Production** and any
   other environment where you intend to test submissions.
3. Deploy or redeploy after adding the variables. The local `.env` file is ignored
   by Git and is **not** automatically uploaded to Vercel.
4. Submit a test application on the deployed site. Confirm the lead appears in
   the intended private group before accepting real applications.

Run `node --test tests/apply.test.js` to check the function without contacting Telegram.
