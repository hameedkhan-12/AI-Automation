import InfoBar from '@/components/infobar'
import Sidebar from '@/components/sidebar'
import React from 'react'

const layout = ({children}: {children: React.ReactNode}) => {
  return (
    <div className='flex overflow-hidden h-screen'>
        <Sidebar />
        <div className='w-full'>
          <InfoBar />
            {children}
        </div>
    </div>
  )
}

export default layout