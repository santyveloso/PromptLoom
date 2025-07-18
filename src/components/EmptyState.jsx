import { motion } from "framer-motion"

export default function EmptyState({ 
  title, 
  description, 
  actionText, 
  onAction, 
  icon = "📝" 
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="flex flex-col items-center justify-center p-6 sm:p-8 text-center"
    >
      <div className="text-5xl sm:text-6xl mb-4 opacity-50">
        {icon}
      </div>
      
      <h3 className="text-lg sm:text-xl lg:text-2xl font-semibold text-gray-700 mb-3 leading-snug">
        {title}
      </h3>
      
      <p className="text-base sm:text-lg text-gray-500 mb-6 max-w-md leading-relaxed">
        {description}
      </p>
      
      {actionText && onAction && (
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={onAction}
          className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold px-6 py-3 sm:px-8 sm:py-4 text-sm sm:text-base rounded-xl shadow-md hover:shadow-lg hover:from-indigo-700 hover:to-purple-700 transition-all duration-200"
        >
          {actionText}
        </motion.button>
      )}
    </motion.div>
  )
}