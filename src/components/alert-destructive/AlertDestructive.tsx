import { AlertCircleIcon } from "lucide-react"

import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert"

type Params = {
  title: string,
  description: string
}

export function AlertDestructive(params: Params) {
  return (
    <Alert variant="destructive" className="max-w-md">
      <AlertCircleIcon />
      <AlertTitle>{params.title}</AlertTitle>
      <AlertDescription>
        {params.description}
      </AlertDescription>
    </Alert>
  )
}
