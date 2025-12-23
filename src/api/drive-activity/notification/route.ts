import { postContentToWebhook } from "@/app/(main)/(pages)/connections/_actions/discord-connection";
import { onCreateNewPageInDatabase } from "@/app/(main)/(pages)/connections/_actions/notion-connection";
import { postMessageToSlack } from "@/app/(main)/(pages)/connections/_actions/slack-connection";
import { db } from "@/lib/client";
import axios from "axios";
import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const headersList = headers();
  let channelResourceId;
  headersList.forEach((value, key) => {
    if (key === "x-goog-resource-id") {
      channelResourceId = value;
    }
  });

  if (channelResourceId) {
    const user = await db.user.findFirst({
      where: {
        googleResourceId: channelResourceId,
      },
      select: {
        clerkId: true,
        credits: true,
      },
    });
    if (
      (user && parseInt(user.credits!) > 0) ||
      user?.credits === "Unlimited"
    ) {
      const workflows = await db.workflows.findMany({
        where: {
          userId: user.clerkId,
        },
      });
      if (workflows) {
        workflows.map(async (workflow) => {
          const flowPath = JSON.parse(workflow.flowPath!);
          let current = 0;
          while (current < flowPath.length) {
            if (flowPath[current] == "Discord") {
              const discordMessage = await db.discordWebhook.findFirst({
                where: {
                  userId: workflow.userId,
                },
                select: {
                  url: true,
                },
              });
              if (discordMessage) {
                await postContentToWebhook(
                  workflow.discordTemplate!,
                  discordMessage.url
                );
                flowPath.splice(flowPath[current], 1);
              }
            }

            if (flowPath[current] == "Slack") {
              const channels = workflow.slackChannels.map((channel) => {
                return {
                  label: "",
                  value: channel,
                };
              });
              await postMessageToSlack(
                workflow.slackAccessToken!,
                channels,
                workflow.slackTemplate!
              );
              flowPath.splice(flowPath[current], 1);
            }

            if (flowPath[current] === "Notion") {
              await onCreateNewPageInDatabase(
                workflow.notionDbId!,
                workflow.notionAccessToken!,
                JSON.parse(workflow.notionTemplate!)
              );
              flowPath.splice(flowPath[current], 1);
            }
            if (flowPath[current] == "Wait") {
              const res = await axios.put(
                "https://api.cron-job.org/jobs",
                {
                  job: {
                    url: `${process.env.NGROK_URI}?flow_id=${workflow.id}`,
                    enabled: "true",
                    schedule: {
                      timezone: "Europe/Istanbul",
                      expiresAt: 0,
                      hours: [-1],
                      mdays: [-1],
                      minutes: ["*****"],
                      months: [-1],
                      wdays: [-1],
                    },
                  },
                },
                {
                  headers: {
                    Authorization: `Bearer ${process.env.CRON_JOB_KEY!}`,
                    "Content-Type": "application/json",
                  },
                }
              );
              if (res) {
                flowPath.splice(flowPath[current], 1);
                const cronPath = await db.workflows.update({
                  where: {
                    id: workflow.id,
                  },
                  data: {
                    cronPath: JSON.stringify(flowPath),
                  },
                });
                if (cronPath) break;
              }
              break;
            }
            current++;
          }

          await db.user.update({
            where: {
              clerkId: user.clerkId,
            },
            data: {
              credits: `${parseInt(user.credits!) - 1}`,
            },
          });
        });
        return NextResponse.json(
          {
            message: "Flow executed successfully",
          },
          {
            status: 200,
          }
        );
      }
    }
  }
  return NextResponse.json(
    {
      message: "Flow not found",
    },
    {
      status: 404,
    }
  )
}
