import { $getRoot } from "lexical";
import React, { useRef, useState } from "react";
import { FORMAT_ELEMENT_COMMAND } from "lexical";
import { $patchStyleText } from "@lexical/selection";
import { ListNode, ListItemNode } from "@lexical/list";
import { $generateHtmlFromNodes } from "@lexical/html";
import { $getSelection, $isRangeSelection } from "lexical";
import { ListPlugin } from "@lexical/react/LexicalListPlugin";
import { LexicalComposer } from "@lexical/react/LexicalComposer";
import { HistoryPlugin } from "@lexical/react/LexicalHistoryPlugin";
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin";
import { OnChangePlugin } from "@lexical/react/LexicalOnChangePlugin";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import { FORMAT_TEXT_COMMAND, UNDO_COMMAND, REDO_COMMAND, } from "lexical";
import { LexicalErrorBoundary } from "@lexical/react/LexicalErrorBoundary";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";

import CloseIcon from "@mui/icons-material/Close";
import {
    Box,
    Card,
    Button,
    Dialog,
    Select,
    MenuItem,
    TextField,
    Typography,
    IconButton,
    InputLabel,
    CardContent,
    FormControl,
    DialogTitle,
    DialogContent,
} from "@mui/material";


type Props = {
    open: boolean;
    onClose: () => void;
};

export default function NewArticleModal({ open, onClose }: Props) {
    const [title, setTitle] = useState("");
    const [category, setCategory] = useState("");
    const [tags, setTags] = useState<string[]>([]);
    const [tagInput, setTagInput] = useState("");
    const [content, setContent] = useState("");
    const [image, setImage] = useState<string | null>(null);

    const fileRef = useRef<HTMLInputElement | null>(null);


    // 🔹 Toolbar Component
    function Toolbar() {
        const [editor] = useLexicalComposerContext();


        const applyFontSize = (size: string) => {
            editor.update(() => {
                const selection = $getSelection();
                if ($isRangeSelection(selection)) {
                    $patchStyleText(selection, {
                        "font-size": size,
                    });
                }
            });
        };


        return (
            <div style={{
                borderBottom: "1px solid #ddd",
                padding: "8px",
                display: "flex",
                gap: "8px",
                background: "#f9f9f9"
            }}>
                <button onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, "bold")}>
                    Bold
                </button>

                {/* Font Size */}
                <select onChange={(e) => applyFontSize(e.target.value)}>
                    <option value="">Font Size</option>
                    <option value="12px">12</option>
                    <option value="16px">16</option>
                    <option value="20px">20</option>
                    <option value="24px">24</option>
                </select>

                <button onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, "italic")}>
                    Italic
                </button>

                <button onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, "underline")}>
                    Underline
                </button>

                {/* Alignment */}
                <button onClick={() => editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, "left")}>
                    Left
                </button>
                <button onClick={() => editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, "center")}>
                    Center
                </button>
                <button onClick={() => editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, "right")}>
                    Right
                </button>
                <button onClick={() => editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, "justify")}>
                    Justify
                </button>

            </div>
        );
    }


    // 🔹 Editor Config
    const editorConfig = {
        namespace: "Editor",
        theme: {},
        onError(error: any) {
            console.error(error);
        },
        nodes: [ListNode, ListItemNode], // ✅ ADD THIS
    };



    const handleAddTag = () => {
        if (!tagInput) return;
        setTags([...tags, tagInput]);
        setTagInput("");
    };

    const handleDeleteTag = (tag: string) => {
        setTags(tags.filter((t) => t !== tag));
    };

    const handleImage = (file?: File) => {
        if (!file || !file.type.startsWith("image/")) return;
        setImage(URL.createObjectURL(file));
    };

    const handlePublish = () => {
        const data = { title, category, tags, content };
        console.log("Publish:", data);

        // reset form
        setTitle("");
        setCategory("");
        setTags([]);
        setContent("");
        setImage(null);

        onClose(); // close popup
    };

    const handleSaveDraft = () => {
        const data = { title, category, tags, content };
        console.log("Publish:", data);

        // reset form
        setTitle("");
        setCategory("");
        setTags([]);
        setContent("");
        setImage(null);

        onClose(); // close popup
    };

    return (
        <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
            {/* Header */}
            <DialogTitle sx={{ display: "flex", justifyContent: "space-between" }}>
                Create New Article 📝
                <IconButton onClick={onClose}>
                    <CloseIcon />
                </IconButton>
            </DialogTitle>

            {/* Content */}
            <DialogContent dividers>
                <Card sx={{ borderRadius: 3, boxShadow: 0 }}>
                    <CardContent>

                        {/* TITLE */}
                        <TextField
                            fullWidth
                            label="Article Title"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            sx={{ mb: 3 }}
                        />

                        {/* SUB - TITLE */}
                        <TextField
                            fullWidth
                            label="Sub Article Title"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            sx={{ mb: 3 }}
                        />

                        {/* CATEGORY */}
                        <FormControl fullWidth sx={{ mb: 3 }}>
                            <InputLabel>Category</InputLabel>
                            <Select
                                value={category}
                                label="Category"
                                onChange={(e) => setCategory(e.target.value)}
                            >
                                <MenuItem value="Technology">Technology</MenuItem>
                                <MenuItem value="Business">Business</MenuItem>
                                <MenuItem value="Lifestyle">Lifestyle</MenuItem>
                            </Select>
                        </FormControl>

                        {/* TAGS */}
                        <Box mb={3}>
                            <Typography mb={1}>Cover Image</Typography>

                            <Box
                                onClick={() => fileRef.current?.click()}
                                sx={{
                                    border: "2px dashed #5cb039",
                                    borderRadius: 2,
                                    p: 3,
                                    textAlign: "center",
                                    cursor: "pointer",
                                }}
                            >
                                {!image ? (
                                    "Click to upload image"
                                ) : (
                                    <img
                                        src={image}
                                        alt="cover"
                                        style={{ width: "100%", borderRadius: 8 }}
                                    />
                                )}
                            </Box>

                            <input
                                ref={fileRef}
                                type="file"
                                hidden
                                accept="image/*"
                                onChange={(e) => handleImage(e.target.files?.[0])}
                            />
                        </Box>

                        {/* CONTENT */}
                        {/* <TextField
                            fullWidth
                            label="Content"
                            multiline
                            rows={6}
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            sx={{ mb: 3 }}
                        /> */}

                        <LexicalComposer initialConfig={editorConfig}>
                            <div style={{ border: "1px solid #ccc", borderRadius: "8px", marginBottom: "3%" }}>

                                {/*Toolbar */}
                                <Toolbar />

                                {/*Editor */}
                                <div style={{ padding: "10px", position: "relative" }}>
                                    <RichTextPlugin
                                        contentEditable={
                                            <ContentEditable
                                                style={{
                                                    minHeight: "150px",
                                                    outline: "none",
                                                    padding: "10px",
                                                }}
                                            />
                                        }
                                        placeholder={
                                            <div
                                                style={{
                                                    position: "absolute",
                                                    top: "10px",
                                                    left: "10px",
                                                    color: "#999",
                                                    pointerEvents: "none",
                                                }}
                                            >
                                                Enter text...
                                            </div>
                                        }
                                        ErrorBoundary={LexicalErrorBoundary}
                                    />
                                    <HistoryPlugin />
                                    <ListPlugin />

                                    {/* Get Editor Value */}
                                    <OnChangePlugin
                                        onChange={(editorState, editor) => {
                                            editorState.read(() => {
                                                // JSON
                                                const json = editorState.toJSON();
                                                console.log("JSON:", json);

                                                // Plain Text
                                                const text = $getRoot().getTextContent();
                                                console.log("Text:", text);

                                                // HTML
                                                const html = $generateHtmlFromNodes(editor, null);
                                                console.log("HTML:", html);
                                            });
                                        }}
                                    />
                                </div>

                            </div>
                        </LexicalComposer>


                        {/* ACTIONS */}
                        <Box display="flex" gap={2}>
                            <Button
                                variant="contained"
                                color="primary"
                                fullWidth
                                onClick={handlePublish}
                            >
                                Publish
                            </Button>

                            <Button
                                variant="outlined"
                                color="warning"
                                fullWidth
                                onClick={handleSaveDraft}
                            >
                                Save Draft
                            </Button>

                            <Button
                                variant="outlined"
                                fullWidth
                                onClick={onClose}
                            >
                                Cancel
                            </Button>
                        </Box>

                    </CardContent>
                </Card>
            </DialogContent>
        </Dialog>
    );
}