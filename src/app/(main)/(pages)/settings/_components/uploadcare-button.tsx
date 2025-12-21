'use client'
import React, { useEffect, useRef, useCallback } from 'react'
import * as LR from '@uploadcare/blocks'
import { useRouter } from 'next/navigation'

type Props = {
  onUpload?: (url: string) => Promise<any>
}

LR.registerBlocks(LR)


const UploadCareButton = ({ onUpload }: Props) => {
  const router = useRouter()
  const ctxProviderRef = useRef<
    typeof LR.UploadCtxProvider.prototype & LR.UploadCtxProvider
  >(null)

  const handleUpload = useCallback(async (e: any) => {
    const url = e.detail.cdnUrl
    if (onUpload) {
      const file = await onUpload(url)
      if (file) {
        router.refresh()
      }
    }
  }, [onUpload, router])

  useEffect(() => {
    ctxProviderRef.current?.addEventListener('file-upload-success', handleUpload)
    
    return () => {
      ctxProviderRef.current?.removeEventListener('file-upload-success', handleUpload)
    }
  }, [handleUpload])

  return (
    <div>
      <lr-config
        ctx-name="my-uploader"
        pubkey="a9428ff5ff90ae7a64eb"
      />

      <lr-file-uploader-regular
        ctx-name="my-uploader"
        css-src={`https://cdn.jsdelivr.net/npm/@uploadcare/blocks@0.35.2/web/lr-file-uploader-regular.min.css`}
      />

      <lr-upload-ctx-provider
        ctx-name="my-uploader"
        ref={ctxProviderRef}
      />
    </div>
  )
}

export default UploadCareButton
