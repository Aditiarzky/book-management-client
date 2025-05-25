import { useState } from "react"
import { Facebook, Instagram, ChevronDown, ChevronUp, AlertCircle, Heart } from "lucide-react"
import { MainLogo } from "./Logo"

export const Footer = () => {
  const [isDisclaimerOpen, setIsDisclaimerOpen] = useState(false)
  const currentYear = new Date().getFullYear()

  return (
    <footer className="py-5 px-8 space-y-6 bg-gray-900 w-full">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex justify-between border-0 pb-2 items-center border-gray-200 solid border-b-[1px]">
          <div>
            <MainLogo type={1} />
          </div>
          <div>
            <ul className="flex space-x-4 text-gray-50 items-center">
              <a href="https://www.instagram.com/riztrnsltion/" target="_blank" rel="noopener noreferrer">
                <li className="hov-b">
                  <Instagram className="h-5" />
                </li>
              </a>
              <a href="https://fb.me/riztranslation" target="_blank" rel="noopener noreferrer">
                <li className="hov-b">
                  <Facebook className="h-5" />
                </li>
              </a>
              <a href="https://discord.gg/tTCzyaP9sj" target="_blank" rel="noopener noreferrer">
                <li className="hov-b">
                  <div
                    className="bg-contain bg-center h-5 w-5 bg-no-repeat invert"
                    style={{
                      backgroundImage: `url(https://assets-global.website-files.com/6257adef93867e50d84d30e2/636e0a6918e57475a843f59f_icon_clyde_black_RGB.svg)`,
                    }}
                  ></div>
                </li>
              </a>
            </ul>
          </div>
        </div>

        {/* Disclaimer Section */}
        <div className="mt-4 mb-2">
          <button
            onClick={() => setIsDisclaimerOpen(!isDisclaimerOpen)}
            className="flex items-center justify-center w-full text-gray-400 hover:text-gray-200 transition-colors duration-200 group"
          >
            <AlertCircle className="h-4 w-4 mr-2 group-hover:text-yellow-400" />
            <span className="text-sm font-medium">Disclaimer</span>
            {isDisclaimerOpen ? <ChevronUp className="h-4 w-4 ml-2" /> : <ChevronDown className="h-4 w-4 ml-2" />}
          </button>

          <div
            className={`overflow-hidden transition-all duration-300 ease-in-out ${isDisclaimerOpen ? "max-h-96 opacity-100 mt-3" : "max-h-0 opacity-0"}`}
          >
            <div className="bg-gray-800 p-4 rounded-md text-gray-300 text-xs leading-relaxed border border-gray-700">
              <p className="mb-2">
                The content on this website, including all fan translations, is not owned by us. We do not claim any
                rights to the original works or materials. All copyrights belong to their respective owners.
              </p>
              <p className="mb-2">
                This site is intended for{" "}
                <span className="text-yellow-400 font-medium">educational and non-commercial purposes only</span>. We
                encourage users to support the original creators by purchasing official releases.
              </p>
              <p>
                If you are a copyright owner and wish for your work to be removed, please{" "}
                <a href="mailto:mymanga1945@gmail.com" className="text-blue-400 hover:underline">
                  contact us
                </a>
                .
              </p>
            </div>
          </div>
        </div>

        <div className="flex justify-center items-center mt-3">
          <span className="text-gray-50 justify-center flex-wrap md:text-md text-sm flex">
            © {currentYear}{" "}
            Made with <Heart className="mx-1 h-5"/> by
            <a
              href="https://www.facebook.com/rizuta.kyma"
              target="_blank"
              rel="noopener noreferrer"
              title="Ingin website seperti ini? Hubungi Akun Facebook Rizuta!"
              className="hover:underline mr-1 ml-1"
            >
              Rizuta.
            </a>
          </span>
        </div>
      </div>
    </footer>
  )
}
