import { Option } from "@/components/ui/multiple-selector";
import { db } from "@/lib/client";
import { currentUser } from "@clerk/nextjs";
import axios from "axios";

export const onSlackConnect = async (
  app_id: string,
  authed_user_id: string,
  authed_user_token: string,
  slack_access_token: string,
  bot_user_id: string,
  team_id: string,
  team_name: string,
  user_id: string
) => {
  if (!slack_access_token) return;

  const slackConnection = await db.slack.findFirst({
    where: {
      slackAccessToken: slack_access_token,
    },
    include: {
      connections: true,
    },
  });

  if (!slackConnection) {
    await db.slack.create({
      data: {
        userId: user_id,
        appId: app_id,
        authedUserId: authed_user_id,
        authedUserToken: authed_user_token,
        slackAccessToken: slack_access_token,
        botUserId: bot_user_id,
        teamId: team_id,
        teamName: team_name,
        connections: {
          create: {
            userId: user_id,
            type: "Slack",
          },
        },
      },
    });
  }
};

export const getSlackConnection = async () => {
  const user = await currentUser();
  if (!user) return null;

  return await db.slack.findFirst({
    where: {
      userId: user.id,
    },
  });
};

export async function listBotChannels(
  slackAccessToken: string
): Promise<Option[]> {
  const url = `https://slack.com/api/conversations.list?token=${new URLSearchParams(
    {
      types: "public_channel, private_channel",
      limit: "200",
    }
  )}`;

  try {
    const { data } = await axios.get(url, {
      headers: {
        Authorization: `Bearer ${slackAccessToken}`,
      },
    });

    console.log(data);

    if (!data.ok) throw new Error(data.error);

    if (!data?.channels?.length) return [];

    return data.channels
      .filter((channel: any) => channel.is_member)
      .map((channel: any) => ({
        label: channel.name,
        value: channel.id,
      }));
  } catch (error) {
    console.error("Error fetching channels",error);
    return [];
  }
}

const postMessageInSlackChannel = async(slackAccessToken: string, slackChannel: string, content: string) => {
    try {
        await axios.post('https://slack.com/api/chat.postMessage', {
            channel: slackChannel,
            text: content
        },
    {
        headers: {
            Authorization: `Bearer ${slackAccessToken}`,
            'Content-Type': 'application/json'
        }
    }
    )

    console.log('Message sent successfully',slackChannel);
    } catch (error) {
        console.error('Error sending message',error);
    }
}

export const postMessageToSlack = async (slackAccessToken: string, selectedSlackChannels: Option[], content: string): Promise<{ message: string }> => {
    if(!content) return { message: 'Content is empty' }
    if(!selectedSlackChannels?.length) return { message: 'No channel selected' }

    try {
        selectedSlackChannels.map(channel => channel.value).forEach(channel => {
            postMessageInSlackChannel(slackAccessToken, channel, content)
        })
    } catch (error) {
        return {
            message: 'Error sending message'
        }
    }

    return {
        message: 'Message sent successfully'
    }
}