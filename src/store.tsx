import { create } from "zustand";

export interface Option {
    value: string;
    label: string;
    disable?: boolean;
    fixed?: boolean;
    [key: string]: any;
}

type FuzzieStore = {
    googleFile: any
    setGoogleFile: (file: any) => void
    slackChannels: Option[]
    setSlackChannels: (channels: Option[]) => void
    selectedSlackChannels: Option[]
    setSelectedSlackChannels: (channels: Option[]) => void
}

export const useFuzzieStore = create<FuzzieStore>()((set) => ({
    googleFile: {},
    setGoogleFile: (file: any) => set({ googleFile: file }),
    slackChannels: [],
    setSlackChannels: (channels: Option[]) => set({ slackChannels: channels }),
    selectedSlackChannels: [],
    setSelectedSlackChannels: (channels: Option[]) => set({ selectedSlackChannels: channels }),
}))