'use server'
import { db } from "@/lib/client"
import { currentUser } from "@clerk/nextjs"
import axios from "axios"

export const onDiscordConnect = async (
    channel_id: string,
    webhook_id: string,
    webhook_name: string,
    webhook_url: string,
    id: string,
    guild_id: string,
    guild_name: string
) => {
    if(webhook_id){
        const webhook = await db.discordWebhook.findFirst({
            where: {
                userId: id
            },
            include: {
                connections: {
                    select: {
                        type: true
                    }
                }
            }
        })
        if(!webhook) {
            await db.discordWebhook.create({
                data: {
                    userId: id,
                    webhookId: webhook_id,
                    channelId: channel_id!,
                    guildId: guild_id,
                    name: webhook_name,
                    url: webhook_url,
                    guildName: guild_name,
                    connections: {
                        create: {
                            userId: id,
                            type: 'Discord'
                        }
                    }
                }
            })
        }

        const webhook_channel = await db.discordWebhook.findUnique({
            where: {
                channelId: channel_id,
            },
            include: {
                connections: {
                    select: {
                        type: true
                    }
                }
            }
        })
        if(!webhook_channel){
            await db.discordWebhook.create({
                data: {
                    userId: id,
                    webhookId: webhook_id,
                    channelId: channel_id,
                    guildId: guild_id,
                    name: webhook_name,
                    url: webhook_url,
                    guildName: guild_name,
                    connections: {
                        create: {
                            userId: id,
                            type: 'Discord'
                        }
                    }
                }
            })
        }
    }
}

export const getDiscordConnectionUrl = async() => {
    const user = await currentUser()
    if(!user) return null;

    const webhook = await db.discordWebhook.findFirst({
        where: {
            userId: user.id
        },
        select: {
            url: true,
            name: true,
            guildName: true
        }
    })
    return webhook;
}

export const postContentToWebhook = async(content: string, url: string) => {
    console.log(content, url)

    if(content !=""){
        const posted = await axios.post(url, {content})
        if(posted) {
            return { message: "Success"}
        }
        return { message: "Failed"}
    }
    return { message: "String Empty"}
}