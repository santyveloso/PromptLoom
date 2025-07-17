import { motion } from "framer-motion"

export default function LoadingSpinner({ 
  size = "md", 
  color = "indigo",
  text = null 
}) {
  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-8 h-8", 
    lg: "w-12 h-12",
    xl: "w-16 h-16"
  }

  const colorClasses = {
    indigo: "border-indigo-500",
    blue: "border-blue-500",
    green: "border-green-500",
    purple: "border-purple-500",
    pink: "border-pink-500"
  }

  return (
    <div className="flex flex-col items-center justify-center">
      <motion.div
        animate={{ rotate: 360 }}
        transition={{
          duration: 1,
          repeat: Infinity,
          ease: "linear"
        }}
        className={`
          ${sizeClasses[size]} 
          border-2 
          ${colorClasses[color]} 
          border-t-transparent 
          rounded-full
        `}
      />
      
      {text && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="mt-3 text-sm text-gray-600 font-medium"
        >
          {text}
        </motion.p>
      )}
    </div>
  )
}