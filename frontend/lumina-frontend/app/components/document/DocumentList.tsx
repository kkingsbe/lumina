import { ScrollArea } from "@/components/ui/scroll-area"
import DocumentItem from './DocumentItem'
import { LuminaDocument, LuminaMoc } from "@/lib/LuminaClient";

interface DocumentListProps {
  documents: LuminaDocument[];
  mocs: LuminaMoc[];
  setSelectedDocument: React.Dispatch<React.SetStateAction<LuminaDocument | null>>;
  setSelectedMoc: React.Dispatch<React.SetStateAction<LuminaMoc | null>>;
}

const DocumentList: React.FC<DocumentListProps> = ({ documents, mocs, setSelectedDocument, setSelectedMoc }) => (
  <ScrollArea className="h-full">
    <ul>
      {mocs.map((moc) => (
        <DocumentItem 
          key={moc.id} 
          item={moc} 
          itemType="moc"
          setSelectedDocument={setSelectedDocument} 
          setSelectedMoc={setSelectedMoc} 
        />
      ))}
      {documents.map((doc) => (
        <DocumentItem 
          key={doc.id} 
          item={doc} 
          itemType="document"
          setSelectedDocument={setSelectedDocument} 
          setSelectedMoc={setSelectedMoc} 
        />
      ))}
    </ul>
  </ScrollArea>
)

export default DocumentList;