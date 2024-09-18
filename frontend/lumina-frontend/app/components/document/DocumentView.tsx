import { motion } from 'framer-motion'
import { ScrollArea } from "@/components/ui/scroll-area"
import { LuminaDocument } from '@/lib/LuminaClient';

export interface DocumentViewProps {
  selectedDocument: LuminaDocument | null;
}

const DocumentView: React.FC<DocumentViewProps> = ({ selectedDocument }) => (
  <ScrollArea className="h-full">
    {selectedDocument ? (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <h3 className="text-2xl font-bold mb-4 text-blue-400">{selectedDocument.name}</h3>
        <p className="text-gray-300">{selectedDocument.content || "No content available."}</p>
      </motion.div>
    ) : (
      <p className="text-gray-400">Select a document from the Map of Contents to view its content.</p>
    )}
  </ScrollArea>
)

export default DocumentView;