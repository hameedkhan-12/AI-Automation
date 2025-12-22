"use server"
import { db } from "@/lib/client"
import { currentUser } from "@clerk/nextjs"

export const ensureUserExists = async () => {
    const user = await currentUser()
    
    if (!user) return null
    
    let dbUser = await db.user.findUnique({
        where: {
            clerkId: user.id
        }
    })
    
    if (!dbUser) {
        dbUser = await db.user.create({
            data: {
                clerkId: user.id,
                email: user.emailAddresses[0]?.emailAddress || '',
                name: `${user.firstName || ''} ${user.lastName || ''}`.trim() || null,
                profileImage: user.imageUrl || null,
            }
        })
    }
    
    return dbUser
}
export const onCreateWorkflow = async(name: string, description: string) => {
    const user = await currentUser()
    console.log(user)
    
    if(user) {
        // First, ensure the user exists in your database
        // or just verify they exist before creating the workflow
        const dbUser = await db.user.findUnique({
            where: {
                clerkId: user.id
            }
        })
        console.log("DDDDDDDDDDDDDDDDDDDDBBBBBBBBBBBBBBBBBBB", dbUser)
        
        if(!dbUser) {
            return {
                message: "User not found in database"
            }
        }
        
        const workflow = await db.workflows.create({
            data: {
                userId: user.id, // This should match the clerkId in User table
                name,
                description
            }
        })
        
        if(workflow) {
            return {
                message: "Workflow created successfully",
                workflow
            }
        }
        return {
            message: "Failed to create workflow"
        }
    }
    
    return {
        message: "User not authenticated"
    }
}

export const onGetWorkflows = async() => {
    const user = await currentUser();
    if(!user) return null;

    await ensureUserExists()

    const workflows = await db.workflows.findMany({
        where: {
            userId: user.id
        },
    })

    if(workflows) {
        return workflows;
    }
}

export const onFlowPublish = async(workflowId: string, state: boolean) => {
    const published = await db.workflows.update({
        where: {
            id: workflowId
        },
        data: {
            publish: state
        }
    })
    
    if(published.publish) {
        return {
            message: "Workflow published successfully"
        }
    }
    return {
        message: "Failed to publish workflow"
    }
}