import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import DocumentList from './DocumentList'
import DocumentView from './DocumentView'
import { useEffect, useState } from "react";
import { LuminaClient, LuminaDocument, LuminaMoc } from "@/lib/LuminaClient";

// Initialize LuminaClient
const luminaClient = new LuminaClient();

const DocumentBrowser = () => {
    const [selectedMoc, setSelectedMoc] = useState<LuminaMoc | null>(null)
    const [selectedDocument, setSelectedDocument] = useState<LuminaDocument | null>(null)
    const [mocFiles, setMocFiles] = useState<LuminaMoc[]>([]);
    const [documents, setDocuments] = useState<LuminaDocument[]>([]);

    useEffect(() => {
        luminaClient.getMocs().then(response => {
            console.log("MOCs response:", response);
            const rootMoc = response.mocs.find(moc => moc.name === "Lumina Knowledge Base");
            if (rootMoc) {
                luminaClient.getMocContent(rootMoc.id).then(content => {
                    console.log("Root MOC content:", content);
                    setSelectedMoc(content);

                    Promise.all(content.documents.map(id => luminaClient.getMocContent(id)))
                        .then(mocs => {
                            console.log("Raw MOCs:", mocs);
                            const filteredMocs = mocs.filter(item => 'documents' in item) as LuminaMoc[];
                            console.log("Filtered MOCs:", filteredMocs);
                            setMocFiles(filteredMocs);
                        })
                        .catch(error => console.error("Error fetching MOCs:", error));

                    Promise.all(content.documents.map(id => luminaClient.getDocumentContent(id)))
                        .then(docs => {
                            console.log("Raw Documents:", docs);
                            const filteredDocs = docs.filter(item => 'content' in item) as LuminaDocument[];
                            console.log("Filtered Documents:", filteredDocs);
                            setDocuments(filteredDocs);
                        })
                        .catch(error => console.error("Error fetching Documents:", error));
                });
            } else {
                console.error("Root MOC 'Lumina Knowledge Base' not found");
            }
        }).catch(error => console.error("Error fetching MOCs:", error));
    }, []);

    useEffect(() => {
        if (selectedMoc) {
            console.log("Selected MOC:", selectedMoc);
            Promise.all([
                ...selectedMoc.documents.map(id => luminaClient.getMocContent(id)),
                ...selectedMoc.documents.map(id => luminaClient.getDocumentContent(id))
            ]).then(results => {
                console.log("Raw results:", results);
                const mocs = results.filter(item => 'documents' in item) as LuminaMoc[];
                const docs = results.filter(item => 'content' in item) as LuminaDocument[];
                console.log("Updated MOCs:", mocs);
                console.log("Updated Documents:", docs);
                setMocFiles(mocs);
                setDocuments(docs);
            }).catch(error => console.error("Error updating MOCs and Documents:", error));
        }
    }, [selectedMoc]);

    console.log("Current mocFiles:", mocFiles);

    return (
        <div className="flex-grow bg-gray-800 p-6 rounded-2xl shadow-lg overflow-hidden">
            <h2 className="text-3xl font-bold mb-6 text-blue-400">Document Browser</h2>
            <Tabs defaultValue="map" className="h-full flex flex-col">
                <TabsList className="mb-4">
                    <TabsTrigger value="map" className="data-[state=active]:bg-blue-600">Map of Contents</TabsTrigger>
                    <TabsTrigger value="document" className="data-[state=active]:bg-blue-600">Document View</TabsTrigger>
                </TabsList>
                <TabsContent value="map" className="flex-grow overflow-hidden">
                    <DocumentList 
                        documents={documents} 
                        mocs={mocFiles} 
                        setSelectedDocument={setSelectedDocument}
                        setSelectedMoc={setSelectedMoc}
                    />
                </TabsContent>
                <TabsContent value="document" className="flex-grow overflow-hidden">
                    <DocumentView selectedDocument={selectedDocument} />
                </TabsContent>
            </Tabs>
        </div>
    )
}

export default DocumentBrowser;
