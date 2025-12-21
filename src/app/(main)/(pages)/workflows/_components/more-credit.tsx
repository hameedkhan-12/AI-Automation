"use client";
import { Card, CardContent, CardDescription } from '@/components/ui/card';
import { useBilling } from '@/providers/billing-providers'
import React from 'react'

const MoreCredits = () => {
    const { credits } = useBilling();

  return credits !== '0' ? (
    <></>
  ) : (
      <Card>
        <CardContent className='p-6'>
            <CardDescription>You are out of Credits</CardDescription>
        </CardContent>
      </Card>
  )
}

export default MoreCredits