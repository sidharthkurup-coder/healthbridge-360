'use client';

import React from 'react';
import { PageTransitionStage } from '@/components/ui/Motion';

export default function Template({ children }: { children: React.ReactNode }) {
    return <PageTransitionStage>{children}</PageTransitionStage>;
}
