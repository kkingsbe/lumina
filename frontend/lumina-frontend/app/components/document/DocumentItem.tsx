import { motion } from 'framer-motion'
import { Button } from "@/components/ui/button"
import { ChevronRight, FileText, Folder } from "lucide-react"
import { LuminaDocument, LuminaMoc } from '@/lib/LuminaClient';

interface DocumentItemProps {
  item: LuminaDocument | LuminaMoc;
  itemType: 'document' | 'moc';
  setSelectedDocument: React.Dispatch<React.SetStateAction<LuminaDocument | null>>;
  setSelectedMoc: React.Dispatch<React.SetStateAction<LuminaMoc | null>>;
}

const DocumentItem: React.FC<DocumentItemProps> = ({ item, itemType, setSelectedDocument, setSelectedMoc }) => (
  <motion.li
    initial={{ opacity: 0, x: -20 }}
    animate={{ opacity: 1, x: 0 }}
    transition={{ duration: 0.3 }}
    className="mb-2"
  >
    <Button
      variant="ghost"
      className="w-full justify-start text-left hover:bg-gray-700"
      onClick={() => {
        if (itemType === 'document') {
          setSelectedDocument(item as LuminaDocument);
        } else {
          setSelectedMoc(item as LuminaMoc);
        }
      }}
    >
      {itemType === 'moc' ? <Folder className="mr-2 text-yellow-400" /> : <FileText className="mr-2 text-blue-400" />}
      {item.name}
      {itemType === 'moc' && <ChevronRight className="ml-auto" />}
    </Button>
  </motion.li>
)

export default DocumentItem;
