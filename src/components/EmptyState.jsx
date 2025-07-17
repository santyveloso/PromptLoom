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
      className="flex flex-col items-center justify-center p-8 text-center"
    >
      <div className="text-6xl mb-4 opacity-50">
        {icon}
      </div>
      
      <h3 className="text-xl font-semibold text-gray-700 mb-2">
        {title}
      </h3>
      
      <p className="text-gray-500 mb-6 max-w-md leading-relaxed">
        {description}
      </p>
      
      {actionText && onAction && (
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={onAction}
          className="
            bg-gradient-to-r 
            from-indigo-500 
            to-purple-600 
            text-white 
            px-6 
            py-3 
            rounded-lg 
            font-medium 
            shadow-md 
            hover:shadow-lg 
            transition-all 
            duration-200
          "
        >
          {actionText}
        </motion.button>
      )}
    </motion.div>
  )
}