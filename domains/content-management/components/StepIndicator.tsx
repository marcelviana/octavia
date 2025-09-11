import { Upload, FileText, Check } from "lucide-react"

interface StepIndicatorProps {
  currentStep: number
}

export function StepIndicator({ currentStep }: StepIndicatorProps) {
  const steps = [
    {
      number: 1,
      title: "Add Content",
      active: currentStep >= 1,
      icon: Upload,
    },
    {
      number: 2,
      title: "Add Details",
      active: currentStep >= 2,
      icon: FileText,
    },
    { 
      number: 3, 
      title: "Complete", 
      active: currentStep >= 3, 
      icon: Check 
    },
  ]

  return (
    <div className="flex items-center justify-center space-x-4 mb-6">
      {steps.map((step, index) => {
        const Icon = step.icon
        return (
          <div key={step.number} className="flex items-center">
            <div className="flex flex-col items-center">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium transition-all duration-300 ${
                  step.active
                    ? "bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-md"
                    : "bg-white border-2 border-amber-200 text-amber-600"
                }`}
              >
                {currentStep > step.number ? (
                  <Check className="w-4 h-4" />
                ) : (
                  <Icon className="w-4 h-4" />
                )}
              </div>
              <span
                className={`mt-2 text-xs font-medium transition-colors ${
                  step.active ? "text-gray-900" : "text-amber-600"
                }`}
              >
                {step.title}
              </span>
            </div>
            {index < steps.length - 1 && (
              <div
                className={`w-12 h-0.5 mx-1 rounded-full transition-colors ${
                  currentStep > step.number
                    ? "bg-gradient-to-r from-amber-500 to-orange-600"
                    : "bg-amber-200"
                }`}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}