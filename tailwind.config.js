// tailwind.config.js
module.exports = {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        breeSerif: ["Bree Serif", "serif"],
        redHatText: ["Red Hat Text", "sans-serif"],
        redHatDisplay: ["Red Hat Display", "sans-serif"],
      },
      animation: {
        "fade-in-down": "fadeInDown 0.5s ease-out",
        "fade-in-up": "fadeInUp 0.5s ease-out",
        "scale-in": "scaleIn 0.5s ease-out",
        "slide-in-left": "slideInLeft 0.5s ease-out",
        "slide-in-right": "slideInRight 0.5s ease-out",
        "pulse-slow": "pulseSlow 2s infinite",
        "float": "floatAnimation 3s infinite ease-in-out",
        "fade-in": "fadeIn 0.8s ease-out forwards",
		    "gradient-x": "gradientX 5s ease-in-out infinite",
      },
      keyframes: {
		    gradientX: {
		    	"0%": { backgroundPosition: "0% 50%" },
		    	"50%": { backgroundPosition: "100% 50%" },
		    	"100%": { backgroundPosition: "0% 50%" },
		    },
        fadeInDown: {
          "0%": { opacity: 0, transform: "translateY(-20px)" },
          "100%": { opacity: 1, transform: "translateY(0)" },
        },
        fadeInUp: {
          "0%": { opacity: 0, transform: "translateY(20px)" },
          "100%": { opacity: 1, transform: "translateY(0)" },
        },
        scaleIn: {
          "0%": { opacity: 0, transform: "scale(0.95)" },
          "100%": { opacity: 1, transform: "scale(1)" },
        },
        slideInLeft: {
          "0%": { opacity: 0, transform: "translateX(-20px)" },
          "100%": { opacity: 1, transform: "translateX(0)" },
        },
        slideInRight: {
          "0%": { opacity: 0, transform: "translateX(20px)" },
          "100%": { opacity: 1, transform: "translateX(0)" },
        },
        pulseSlow: {
          "0%, 100%": { opacity: 1 },
          "50%": { opacity: 0.8 },
        },
        fadeIn: {
          "0%": { opacity: 0, transform: "translateY(10px)" },
          "100%": { opacity: 1, transform: "translateY(0)" },
        },
        floatAnimation: {
          "0%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-5px)" },
          "100%": { transform: "translateY(0px)" },
        },
      },
    },
  },
  plugins: [],
}
