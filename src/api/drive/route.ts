import { auth, clerkClient } from "@clerk/nextjs";
import { google } from "googleapis";
import { NextResponse } from "next/server";

export async function GET() {
    const oAuth2Client = new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET,
        process.env.OAUTH2_REDIRECT_URI
    )

    const { userId} = auth()
    if(!userId) {
        return NextResponse.json({
            message: "User not found"
        })
    }

    const clerkResponse = await clerkClient.users.getUserOauthAccessToken(
        userId,
        'oauth_google'
    )

    const accessToken = clerkResponse[0].token;

    oAuth2Client.setCredentials({
        access_token: accessToken
    })

    const drive = google.drive({
        version: 'v3',
        auth: oAuth2Client
    })
    
    try {
        const response = await drive.files.list()
        if(response) {
            return Response.json({
                message: response.data
            },{
                status: 200
            })
        }else {
            return Response.json(
                {
                    message: "No Files Found"
                }, {
                    status: 404
                }
            )
        }
    } catch (error) {
        return Response.json({
            message: "Something went wrong"
        },{
            status: 500
        })
    }
}