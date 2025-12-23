import { db } from "@/lib/client";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
    try {
        const body = await req.json()
        const { id, email_adresses, first_name, image_url} = body?.data
        const email = email_adresses[0]?.email_address

        await db.user.upsert({
            where: { clerkId: id},
            update: {
                email,
                name: first_name,
                profileImage: image_url
            },
            create: {
                clerkId: id,
                email,
                name: first_name || '',
                profileImage: image_url || ''
            }
        })
        return new NextResponse('User updated in database successfully', {status: 200})
    } catch (error) {
        console.error("Error updating user:", error)
        return new NextResponse('Error updating user', {status: 500})
    }
}