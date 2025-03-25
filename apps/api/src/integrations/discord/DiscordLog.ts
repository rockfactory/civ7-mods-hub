import { Webhook, WebhookClient } from 'discord.js';
import type { SyncMod, SyncModVersion } from '../../mods/utils/scrapeMods';
import { ModsRecord, ModVersionsRecord } from '@civmods/parser';
import * as redactEnv from 'redact-env';

const secrets = redactEnv.build(
  [
    'GITHUB_API_TOKEN',
    'DISCORD_LOG_WEBHOOK',
    'POCKETBASE_TOKEN',
    'POCKETBASE_USER',
    'POCKETBASE_PASSWORD',
  ],
  process.env
);

export const discordLogWebhookClient = process.env.DISCORD_LOG_WEBHOOK
  ? new WebhookClient({
      url: process.env.DISCORD_LOG_WEBHOOK,
    })
  : null;

/**
 * Non-blocking logging to Discord
 */
export class DiscordLog {
  static onVersionProcessing(mod: ModsRecord, version: ModVersionsRecord) {
    discordLogWebhookClient
      ?.send({
        avatarURL: 'https://civmods.com/static/logo.png',
        username: 'CivMods Metadata',
        content: `Processing new version`,
        embeds: [
          {
            title: `${mod.name ?? ''} | ${version.name ?? 'N/A'}`.slice(0, 256),
            color: 956648,
            fields: [
              {
                name: 'CivFanatics ID',
                value: version.cf_id ?? 'N/A',
                inline: true,
              },
              {
                name: 'Mod ID',
                value: mod.id,
                inline: true,
              },
              {
                name: 'Released',
                value: version.released
                  ? new Date(version.released).toLocaleDateString()
                  : 'N/A',
                inline: true,
              },
            ],
          },
        ],
      })
      .catch(console.error);
  }

  static onVersionError(
    mod: ModsRecord,
    version: ModVersionsRecord,
    error: unknown
  ) {
    discordLogWebhookClient
      ?.send({
        avatarURL: 'https://civmods.com/static/logo.png',
        username: 'CivMods Metadata',
        content: `Error processing version of [${mod.name}](${mod.url}): **${version.name}**`,
        embeds: [
          {
            title: 'Error',
            color: 15207950,
            description: redactEnv
              .redact(
                error instanceof Error ? error.message : String(error),
                secrets
              )
              .slice(0, 4090),
            fields: [
              {
                name: 'Mod URL',
                value: mod.url ?? 'N/A',
                inline: true,
              },
              {
                name: 'Version',
                value: version.name ?? 'N/A',
                inline: true,
              },
              {
                name: 'CivFanatics ID',
                value: version.cf_id ?? 'N/A',
                inline: true,
              },
              {
                name: 'Mod ID',
                value: mod.id,
                inline: true,
              },
              {
                name: 'Released',
                value: version.released
                  ? new Date(version.released).toLocaleDateString()
                  : 'N/A',
                inline: true,
              },
            ],
          },
          ...(error instanceof Error && error.stack
            ? [
                {
                  title: 'Stack Trace',
                  color: 15207950,
                  description:
                    '```' +
                    redactEnv.redact(error.stack.slice(0, 4080), secrets) +
                    '```',
                },
              ]
            : []),
          // Download URL
          {
            title: 'Download URL',
            url: version.download_url ?? 'N/A',
          },
        ],
      })
      .catch(console.error);
  }

  static onVersionProcessed(mod: ModsRecord, version: ModVersionsRecord) {
    discordLogWebhookClient
      ?.send({
        avatarURL: 'https://civmods.com/static/logo.png',
        username: 'CivMods Metadata',
        content: `Processed new version`,
        embeds: [
          {
            title: `${mod.name ?? ''} | ${version.name ?? 'N/A'}`.slice(0, 256),
            color: 976997,
            url: mod.url,
            fields: [
              {
                name: 'Assigned ID',
                value: version.id,
                inline: true,
              },
              {
                name: 'Skip Install?',
                value: version.skip_install ? 'Yes' : 'No',
                inline: true,
              },
              {
                name: 'Modinfo ID',
                value: version.modinfo_id ?? 'N/A',
                inline: true,
              },
              {
                name: 'Hash (stable)',
                value: version.hash_stable ?? 'N/A',
              },
              {
                name: 'Download URL',
                value: version.download_url ?? 'N/A',
              },
            ],
          },
        ],
      })
      .catch(console.error);
  }
}
