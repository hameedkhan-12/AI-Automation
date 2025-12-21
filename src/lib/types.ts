import { z } from 'zod'
import { Node, Edge } from 'reactflow'

export const EditUserProfileSchema = z.object({
    name: z.string().min(1, "Required"),
    email: z.string().min(1, "Required"),
})

export type ConnectionTypes = 'Slack' | 'Discord' | 'Google Drive' | 'Notion'

export type ConnectionProviderProps = {
  discordNode: {
    webhookURL: string
    content: string
    webhookName: string
    guildName: string
  }
  setDiscordNode: React.Dispatch<React.SetStateAction<any>>
  googleNode: {}[]
  setGoogleNode: React.Dispatch<React.SetStateAction<any>>
  notionNode: {
    accessToken: string
    databaseId: string
    workspaceName: string
    content: ''
  }
  workflowTemplate: {
    discord?: string
    notion?: string
    slack?: string
  }
  setNotionNode: React.Dispatch<React.SetStateAction<any>>
  slackNode: {
    appId: string
    authedUserId: string
    authedUserToken: string
    slackAccessToken: string
    botUserId: string
    teamId: string
    teamName: string
    content: string
  }
  setSlackNode: React.Dispatch<React.SetStateAction<any>>
  setWorkflowTemplate: React.Dispatch<
    React.SetStateAction<{
      discord?: string
      notion?: string
      slack?: string
    }>
  >
  isLoading: boolean
  setIsLoading: React.Dispatch<React.SetStateAction<boolean>>
}

export type Connection = {
    title: ConnectionTypes
    description: string
    image: string
    connectionKey: keyof ConnectionProviderProps
    accessTokenKey?: string
    alwaysTrue?: boolean
    slackSpecial?: boolean
}

export const WorkflowFormSchema = z.object({
  name: z.string().min(1, "Required"),
  description: z.string().min(1, "Required"),
})

export type EditorCanvasTypes =
  | 'Email'
  | 'Condition'
  | 'AI'
  | 'Slack'
  | 'Google Drive'
  | 'Notion'
  | 'Custom Webhook'
  | 'Google Calendar'
  | 'Trigger'
  | 'Action'
  | 'Wait'

export type EditorCanvasCardType = {
  title: string
  description: string
  completed: boolean
  current: boolean
  metadata: any
  type: EditorCanvasTypes
}

// Use ReactFlow's Node type with your custom data
export type EditorNodeType = Node<EditorCanvasCardType>

// Alias for clarity
export type EditorNode = EditorNodeType

// Use ReactFlow's Edge type
export type EditorEdge = Edge

export type EditorActions =
  | {
      type: 'LOAD_DATA'
      payload: {
        elements: EditorNodeType[]
        edges: EditorEdge[]
      }
    }
  | {
      type: 'UPDATE_NODE'
      payload: {
        elements: EditorNodeType[]
      }
    }
  | { type: 'REDO' }
  | { type: 'UNDO' }
  | {
      type: 'SELECTED_ELEMENT'
      payload: {
        element: EditorNode
      }
    }

export const nodeMapper: Record<string, string> = {
  Notion: 'notionNode',
  Slack: 'slackNode',
  Discord: 'discordNode',
  'Google Drive': 'googleNode',
}