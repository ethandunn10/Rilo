import react from '@vitejs/plugin-react'
import basicSsl from '@vitejs/plugin-basic-ssl'
import { defineConfig } from 'vite'

/* Voice input (speech recognition and getUserMedia) only works in a SECURE
   CONTEXT: https, or localhost. Testing on a real phone means a LAN address
   like http://192.168.1.44:5181, which is neither — so "talk instead" can
   never work there, however correct the code is.
 *
 * `npm run dev:https` serves the same thing over https with a self-signed
 * certificate so voice can actually be tested on a phone. The phone will
 * warn that the certificate isn't trusted; accept it once and it sticks.
 *
 * Plain `npm run dev` stays http — faster, no warning — and is fine for
 * everything except voice.
 */
export default defineConfig(({ mode }) => ({
  plugins: [react(), ...(mode === 'https' ? [basicSsl()] : [])],
  server: {
    /* always reachable from a phone on the same wifi */
    host: true,
  },
}))
