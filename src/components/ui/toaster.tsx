import { useToast } from "./use-toast"
import { motion, AnimatePresence } from "framer-motion"

export function Toaster() {
  const { toasts } = useToast()

  return (
    <div className="fixed bottom-24 right-4 z-50 flex flex-col gap-2 max-w-sm w-full">
      <AnimatePresence>
        {toasts.map((toast, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className={`p-4 rounded-xl shadow-xl border backdrop-blur-md ${
              toast.variant === "destructive" 
                ? "bg-destructive/10 border-destructive/20 text-destructive-foreground"
                : "bg-card/80 border-border text-foreground"
            }`}
          >
            {toast.title && <h4 className="font-semibold">{toast.title}</h4>}
            {toast.description && <p className="text-sm opacity-90 mt-1">{toast.description}</p>}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}
