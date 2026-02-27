"use client"

import type { ReactNode } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export interface TabItem {
  id: string
  label: string
  content: ReactNode
  disabled?: boolean
}

interface TabViewProps {
  tabs: TabItem[]
  defaultTab?: string
  className?: string
  onChange?: (value: string) => void
}

export function TabView({ tabs, defaultTab, className, onChange }: TabViewProps) {
  return (
    <Tabs defaultValue={defaultTab || tabs[0]?.id} className={className} onValueChange={onChange}>
      <TabsList>
        {tabs.map((tab) => (
          <TabsTrigger key={tab.id} value={tab.id} disabled={tab.disabled}>
            {tab.label}
          </TabsTrigger>
        ))}
      </TabsList>
      {tabs.map((tab) => (
        <TabsContent key={tab.id} value={tab.id}>
          {tab.content}
        </TabsContent>
      ))}
    </Tabs>
  )
}
