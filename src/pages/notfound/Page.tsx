import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Home, RefreshCcw, ArrowLeft, Ghost } from "lucide-react"
import { motion } from "framer-motion"
import { Link } from "@tanstack/react-router"
import GuestLayout from "../layouts/GuestLayout"

export default function NotFound() {
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [count, setCount] = useState(0)

  // Follow mouse effect for the ghost
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const centerX = window.innerWidth / 2
      const centerY = window.innerHeight / 2

      // Calculate distance from center (limited movement)
      const distanceX = (e.clientX - centerX) / 20
      const distanceY = (e.clientY - centerY) / 20

      setPosition({
        x: distanceX,
        y: distanceY,
      })
    }

    window.addEventListener("mousemove", handleMouseMove)
    return () => window.removeEventListener("mousemove", handleMouseMove)
  }, [])

  // Fun counter for clicks on the ghost
  const handleGhostClick = () => {
    setCount((prev) => prev + 1)
  }

  return (
    <GuestLayout>
        <div className="min-h-[100dvh] flex flex-col items-center justify-center bg-gradient-to-b from-background to-muted p-4">
      <div className="max-w-md w-full mx-auto text-center space-y-8">
        {/* Animated ghost */}
        <motion.div
          className="relative mx-auto w-32 h-32 mb-8"
          animate={{
            x: position.x,
            y: position.y,
            rotate: [0, 5, 0, -5, 0],
          }}
          transition={{
            rotate: {
              repeat: Number.POSITIVE_INFINITY,
              duration: 5,
              ease: "easeInOut",
            },
            x: { type: "spring", stiffness: 100 },
            y: { type: "spring", stiffness: 100 },
          }}
          onClick={handleGhostClick}
        >
          <Ghost className="w-full h-full text-primary" />

          {/* Eyes that follow mouse */}
          <motion.div
            className="absolute top-10 left-8 w-3 h-3 bg-background rounded-full"
            animate={{ x: position.x / 4, y: position.y / 4 }}
          />
          <motion.div
            className="absolute top-10 right-8 w-3 h-3 bg-background rounded-full"
            animate={{ x: position.x / 4, y: position.y / 4 }}
          />
        </motion.div>

        {/* 404 text */}
        <motion.h1
          className="text-8xl font-extrabold tracking-tight"
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          404
        </motion.h1>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="space-y-4"
        >
          <h2 className="text-2xl font-bold">Page Not Found</h2>

          <p className="text-muted-foreground">
            Oops! The page you're looking for has disappeared into the digital void.
            {count > 0 && (
              <span className="block mt-2 text-sm">
                You've petted the ghost {count} time{count !== 1 ? "s" : ""}!
              </span>
            )}
          </p>

          {/* Action buttons */}
          <div className="flex flex-wrap justify-center gap-4 mt-8">
            <Button asChild variant="default">
              <Link to="/">
                <Home className="mr-2 h-4 w-4" />
                Back to Home
              </Link>
            </Button>

            <Button variant="outline" onClick={() => window.history.back()}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Go Back
            </Button>

            <Button variant="ghost" onClick={() => window.location.reload()}>
              <RefreshCcw className="mr-2 h-4 w-4" />
              Refresh
            </Button>
          </div>
        </motion.div>
      </div>
    </div>
    </GuestLayout>
  )
}
