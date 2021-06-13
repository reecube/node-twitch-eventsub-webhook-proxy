// https://dev.twitch.tv/docs/authentication#scopes

export const Scopes: string[] = [
  // 'analytics:read:extensions', // View analytics data for the Twitch Extensions owned by the authenticated account.
  // 'analytics:read:games', // View analytics data for the games owned by the authenticated account.
  'bits:read', // View Bits information for a channel.
  // 'channel:edit:commercial', // Run commercials on a channel.
  // 'channel:manage:broadcast', // Manage a channel’s broadcast configuration, including updating channel configuration and managing stream markers and stream tags.
  // 'channel:manage:extensions', // Manage a channel’s Extension configuration, including activating Extensions.
  'channel:manage:redemptions', // Manage Channel Points custom rewards and their redemptions on a channel.
  // 'channel:manage:videos', // Manage a channel’s videos, including deleting videos.
  // 'channel:read:editors', // View a list of users with the editor role for a channel.
  'channel:read:hype_train', // View Hype Train information for a channel.
  'channel:read:redemptions', // View Channel Points custom rewards and their redemptions on a channel.
  // 'channel:read:stream_key', // View an authorized user’s stream key.
  'channel:read:subscriptions', // View a list of all subscribers to a channel and check if a user is subscribed to a channel.
  // 'clips:edit', // Manage Clips for a channel.
  'moderation:read', // View a channel’s moderation data including Moderators, Bans, Timeouts, and Automod settings.
  // 'user:edit', // Manage a user object.
  // 'user:edit:follows', // Edit a user’s follows.
  // 'user:manage:blocked_users', // Manage the block list of a user.
  // 'user:read:blocked_users', // View the block list of a user.
  // 'user:read:broadcast', // View a user’s broadcasting configuration, including Extension configurations.
  // 'user:read:subscriptions', // View if an authorized user is subscribed to specific channels.
];
