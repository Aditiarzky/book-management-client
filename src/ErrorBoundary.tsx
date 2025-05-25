import type React from "react"

import { Component, type ReactNode } from "react"
import { AlertTriangle, RefreshCw, Home, ChevronDown, ChevronUp } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"

interface ErrorBoundaryProps {
  children: ReactNode
}

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
  showDetails: boolean
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false, error: null, showDetails: false }
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Error caught by ErrorBoundary:", error, errorInfo)
    // Optionally log to a service like Sentry
  }

  resetError = () => {
    this.setState({ hasError: false, error: null, showDetails: false })
  }

  toggleDetails = () => {
    this.setState((prev) => ({ showDetails: !prev.showDetails }))
  }

  goHome = () => {
    window.location.href = "/"
  }

  getFriendlyMessage(errorMessage: string): string {
    if (errorMessage.includes("Cannot read properties of null")) {
      return "Content unavailable"
    } else if (errorMessage.includes("toString is not a function")) {
      return "Invalid data format"
    } else if (errorMessage.includes("Cannot read properties of undefined")) {
      return "Missing required data"
    } else if (errorMessage.includes("Failed to fetch") || errorMessage.includes("NetworkError")) {
      return "Connection failed"
    } else if (errorMessage.includes("Unauthorized")) {
      return "Access denied"
    } else {
      return "Something went wrong"
    }
  }

  render() {
    if (this.state.hasError) {
      const errorMessage = this.state.error?.message || "Unknown error"
      const friendlyMessage = this.getFriendlyMessage(errorMessage)

      return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-gray-50 to-gray-100">
          <Card className="w-full max-w-md shadow-lg border-0 bg-white/80 backdrop-blur-sm">
            <CardContent className="p-8 text-center space-y-6">
              {/* Icon with animation */}
              <div className="flex justify-center">
                <div className="relative">
                  <div className="absolute inset-0 bg-red-100 rounded-full animate-ping opacity-75"></div>
                  <div className="relative bg-red-50 p-4 rounded-full">
                    <AlertTriangle className="w-8 h-8 text-red-500" />
                  </div>
                </div>
              </div>

              {/* Main message */}
              <div className="space-y-2">
                <h1 className="text-xl font-semibold text-gray-900">{friendlyMessage}</h1>
                <p className="text-sm text-gray-500">Don't worry, this happens sometimes</p>
              </div>

              {/* Action buttons */}
              <div className="flex gap-3 justify-center">
                <Button
                  onClick={this.resetError}
                  className="flex items-center gap-2 transition-all duration-200 hover:scale-105"
                >
                  <RefreshCw className="w-4 h-4" />
                  Try Again
                </Button>
                <Button
                  variant="outline"
                  onClick={this.goHome}
                  className="flex items-center gap-2 hover:bg-gray-50 transition-all duration-200 hover:scale-105"
                >
                  <Home className="w-4 h-4" />
                  Home
                </Button>
              </div>

              {/* Collapsible error details */}
              <Collapsible>
                <CollapsibleTrigger
                  onClick={this.toggleDetails}
                  className="flex items-center gap-2 text-xs text-gray-400 hover:text-gray-600 transition-colors mx-auto"
                >
                  Technical details
                  {this.state.showDetails ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                </CollapsibleTrigger>
                <CollapsibleContent className="mt-3">
                  <div className="bg-gray-50 rounded-lg p-3 text-left">
                    <code className="text-xs text-gray-600 break-all">{errorMessage}</code>
                  </div>
                </CollapsibleContent>
              </Collapsible>
            </CardContent>
          </Card>
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary
