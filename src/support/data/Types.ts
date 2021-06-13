// https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types

export const Types: string[] = [
  // 'channel.update', // Channel Update: A broadcaster updates their channel properties e.g., category, title, mature flag, broadcast, or language.
  'channel.follow', // Channel Follow: A specified channel receives a follow.
  'channel.subscribe', // Channel Subscribe: A notification when a specified channel receives a subscriber. This does not include resubscribes.
  'channel.cheer', // Channel Cheer: A user cheers on the specified channel.
  // 'channel.raid', // Channel Raid: A broadcaster raids another broadcaster’s channel.
  // 'channel.ban', // Channel Ban: A viewer is banned from the specified channel.
  // 'channel.unban', // Channel Unban: A viewer is unbanned from the specified channel.
  // 'channel.moderator.add', // Channel Moderator Add: Moderator privileges were added to a user on a specified channel.
  // 'channel.moderator.remove', // Channel Moderator Remove: Moderator privileges were removed from a user on a specified channel.
  // 'channel.channel_points_custom_reward.add', // Channel Points Custom Reward Add: A custom channel points reward has been created for the specified channel.
  // 'channel.channel_points_custom_reward.update', // Channel Points Custom Reward Update: A custom channel points reward has been updated for the specified channel.
  // 'channel.channel_points_custom_reward.remove', // Channel Points Custom Reward Remove: A custom channel points reward has been removed from the specified channel.
  'channel.channel_points_custom_reward_redemption.add', // Channel Points Custom Reward Redemption Add: A viewer has redeemed a custom channel points reward on the specified channel.
  'channel.channel_points_custom_reward_redemption.update', // Channel Points Custom Reward Redemption Update: A redemption of a channel points custom reward has been updated for the specified channel.
  'channel.hype_train.begin', // Hype Train Begin: A hype train begins on the specified channel.
  'channel.hype_train.progress', // Hype Train Progress: A hype train makes progress on the specified channel.
  'channel.hype_train.end', // Hype Train End: A hype train ends on the specified channel.
  'stream.online', // Stream Online: The specified broadcaster starts a stream.
  'stream.offline', // Stream Offline: The specified broadcaster stops a stream.
  // 'user.authorization.revoke', // User Authorization Revoke: A user’s authorization has been revoked for your client id.
  // 'user.update', // User Update: A user has updated their account.
];
