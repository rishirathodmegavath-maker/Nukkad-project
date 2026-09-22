import { Component, type ErrorInfo, type ReactNode } from 'react'
import { AlertCircle, RefreshCw, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/Button'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error?: Error
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Unhandled React Rendering Error caught by ErrorBoundary:', error, errorInfo)
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined })
  }

  handleGoBack = () => {
    window.history.back()
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <div className="min-h-[50vh] flex flex-col items-center justify-center text-center p-6 sm:p-8">
          <div className="size-14 rounded-xl bg-danger-500/10 border border-danger-500/20 text-danger-500 flex items-center justify-center mb-4 shadow-xs">
            <AlertCircle className="size-7" />
          </div>
          <h2 className="text-xl font-bold text-fg tracking-tight mb-1.5">Something went wrong</h2>
          <p className="text-sm text-fg-muted max-w-md leading-relaxed mb-6">
            We couldn’t load this section. The application encountered an unexpected display issue.
          </p>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              leftIcon={<ArrowLeft className="size-3.5" />}
              onClick={this.handleGoBack}
            >
              Go back
            </Button>
            <Button
              variant="primary"
              size="sm"
              leftIcon={<RefreshCw className="size-3.5" />}
              onClick={this.handleRetry}
            >
              Try again
            </Button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
