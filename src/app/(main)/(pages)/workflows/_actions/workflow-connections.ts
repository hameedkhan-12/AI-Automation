import { db } from "@/lib/client"
import { currentUser } from "@clerk/nextjs"

export const onCreateWorkflow = async(name: string, description: string) => {
    const user = await currentUser()
    if(user) {
        const workflow = await db.workflows.create({
            data: {
                userId: user.id,
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
}

export const onGetWorkflows = async() => {
    const user = await currentUser();
    if(!user) return null;

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