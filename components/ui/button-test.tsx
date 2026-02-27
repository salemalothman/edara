"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { InteractiveButton } from "@/components/ui/interactive-button"
import { TooltipButton } from "@/components/ui/tooltip-button"
import { ResponsiveButton } from "@/components/ui/responsive-button"
import { LoadingButton } from "@/components/ui/loading-button"
import { ButtonGroup } from "@/components/ui/button-group"
import { useButtonFeedback } from "@/hooks/use-button-feedback"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Download, Plus, Save, Trash, User } from "lucide-react"
import { TooltipProvider } from "@/components/ui/tooltip"

/**
 * ButtonTest - A component to test and demonstrate all button variants
 */
export function ButtonTest() {
  const [isLoading, setIsLoading] = React.useState(false)
  const { state, handleAction } = useButtonFeedback({
    successMessage: "Action completed successfully",
    errorMessage: "Action failed. Please try again.",
  })

  const simulateAsyncAction = async () => {
    setIsLoading(true)
    await new Promise((resolve) => setTimeout(resolve, 2000))
    setIsLoading(false)
  }

  const simulateSuccessAction = async () => {
    await new Promise((resolve) => setTimeout(resolve, 1500))
    return Promise.resolve()
  }

  const simulateErrorAction = async () => {
    await new Promise((resolve) => setTimeout(resolve, 1500))
    return Promise.reject(new Error("Simulated error"))
  }

  return (
    <TooltipProvider>
      <Card>
        <CardHeader>
          <CardTitle>Button Components Test</CardTitle>
          <CardDescription>Test all button variants and states</CardDescription>
        </CardHeader>
        <CardContent className="space-y-8">
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Standard Buttons</h3>
            <ButtonGroup>
              <Button variant="default">Default</Button>
              <Button variant="destructive">Destructive</Button>
              <Button variant="outline">Outline</Button>
              <Button variant="secondary">Secondary</Button>
              <Button variant="ghost">Ghost</Button>
              <Button variant="link">Link</Button>
            </ButtonGroup>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-medium">Button Sizes</h3>
            <ButtonGroup>
              <Button size="xs">Extra Small</Button>
              <Button size="sm">Small</Button>
              <Button size="default">Default</Button>
              <Button size="lg">Large</Button>
              <Button size="icon">
                <Plus className="h-4 w-4" />
              </Button>
            </ButtonGroup>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-medium">Loading States</h3>
            <ButtonGroup>
              <Button loading>Loading</Button>
              <Button loading loadingText="Saving...">
                Save
              </Button>
              <LoadingButton isLoading={isLoading} loadingText="Processing..." onClick={simulateAsyncAction}>
                Click to Load
              </LoadingButton>
            </ButtonGroup>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-medium">Interactive Buttons</h3>
            <ButtonGroup>
              <InteractiveButton onAction={simulateSuccessAction} loadingText="Processing..." successText="Success!">
                Success Action
              </InteractiveButton>

              <InteractiveButton
                onAction={simulateErrorAction}
                loadingText="Processing..."
                errorText="Failed!"
                variant="destructive"
              >
                Error Action
              </InteractiveButton>
            </ButtonGroup>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-medium">Tooltip Buttons</h3>
            <ButtonGroup>
              <TooltipButton tooltipContent="Add a new user" variant="outline">
                <User className="h-4 w-4 mr-2" /> Add User
              </TooltipButton>

              <TooltipButton tooltipContent="Delete this item permanently" variant="destructive" tooltipSide="bottom">
                <Trash className="h-4 w-4 mr-2" /> Delete
              </TooltipButton>
            </ButtonGroup>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-medium">Responsive Buttons</h3>
            <div className="flex space-x-4">
              <ResponsiveButton
                icon={<Save className="h-4 w-4" />}
                label="Save Document"
                tooltipContent="Save Document"
                variant="outline"
              />

              <ResponsiveButton
                icon={<Download className="h-4 w-4" />}
                label="Download Report"
                tooltipContent="Download Report"
                variant="default"
              />
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-medium">Button Groups</h3>
            <div className="space-y-4">
              <ButtonGroup>
                <Button variant="outline">Day</Button>
                <Button variant="outline">Week</Button>
                <Button variant="default">Month</Button>
                <Button variant="outline">Year</Button>
              </ButtonGroup>

              <ButtonGroup orientation="vertical" className="w-40">
                <Button variant="default">View</Button>
                <Button variant="outline">Edit</Button>
                <Button variant="outline">Share</Button>
                <Button variant="destructive">Delete</Button>
              </ButtonGroup>
            </div>
          </div>
        </CardContent>
      </Card>
    </TooltipProvider>
  )
}
