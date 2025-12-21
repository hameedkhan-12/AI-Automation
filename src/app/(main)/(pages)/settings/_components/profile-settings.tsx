'use client'
import React from 'react'
import ProfilePicture from './profile-picture'
import { db } from '@/lib/client'
import { currentUser } from '@clerk/nextjs'

type Props = {
    profileImage: string | null
    onRemoveProfileImage?: () => void
    onUploadProfileImage?: (url: string) => Promise<any>
}

const ProfileSettings = async({ profileImage, onRemoveProfileImage, onUploadProfileImage }: Props) => {

    return (
        <ProfilePicture 
            onDelete={onRemoveProfileImage}
            userImage={profileImage || ""}
            onUpload={onUploadProfileImage}
        />
    )
}

export default ProfileSettings
