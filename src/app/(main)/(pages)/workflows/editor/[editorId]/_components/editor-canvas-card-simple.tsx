import { EditorCanvasCardType } from '@/lib/types'
import { useEditor } from '@/providers/editor-provider'
import React, { useMemo } from 'react'
import { useNodeId } from 'reactflow'
import EditorCanvasIconHelper from './editor-canvas-icon-helper'
import CustomHandle from './custom-handle'
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

const EditorCanvasCardSingle = ({data} : {data: EditorCanvasCardType}) => {
    const { dispatch, state} = useEditor()
    const nodeId = useNodeId()
    const logo = useMemo(() => {
        return <EditorCanvasIconHelper type = {data.type} />
    }, [data])
  return (
    <>
      {data.type !== "Trigger" && data.type !== "Google Drive" && (
        <CustomHandle />
      )}  
      <Card>
        <CardHeader>
            <div>{logo}</div>
            <div>
                <CardTitle>{data.title}</CardTitle>
                <CardDescription>
                    <p className=''>
                        <b>ID: </b>
                        {nodeId}
                    </p>
                </CardDescription>
            </div>
        </CardHeader>
      </Card>
    </>
  )
}

export default EditorCanvasCardSingle