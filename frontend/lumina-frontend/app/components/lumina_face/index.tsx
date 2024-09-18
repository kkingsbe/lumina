import { motion } from 'framer-motion'

const LuminaFace: React.FC = () => (
    <motion.div
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="mb-6 bg-gradient-to-br from-blue-600 to-purple-600 p-6 rounded-2xl shadow-lg"
    >
      <h2 className="text-3xl font-bold mb-4 text-white">Lumina</h2>
      <div className="w-32 h-32 bg-white rounded-full mx-auto overflow-hidden border-4 border-blue-300">
        <img src="/headshot.png" alt="Lumina's face" className="w-full h-full object-cover" />
      </div>
    </motion.div>
)

export default LuminaFace;

