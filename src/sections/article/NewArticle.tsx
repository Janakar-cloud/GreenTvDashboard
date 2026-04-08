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
    Chip,
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

import { type ArticleItem, type ArticlePayload } from "src/api/articles";

type Props = {
    open: boolean;
    onClose: () => void;
    onSave: (data: ArticlePayload) => void;
    initialData?: ArticleItem;
};

export default function NewArticleModal({ open, onClose, onSave, initialData }: Props) {
    const [title, setTitle] = useState("");
    const [subtitle, setSubtitle] = useState("");
    const [coverImage, setCoverImage] = useState("");
    const [bodyMd, setBodyMd] = useState("");
    const [readTime, setReadTime] = useState("");
    const [publishDate, setPublishDate] = useState("");
    const [status, setStatus] = useState<'published' | 'draft'>('draft');
    const [tagInput, setTagInput] = useState("");
    const [tags, setTags] = useState<string[]>([]);
    const [image, setImage] = useState<string | null>(null);

    const fileRef = useRef<HTMLInputElement | null>(null);

    const handleImage = (file?: File) => {
        if (!file || !file.type.startsWith("image/")) return;
        setImage(URL.createObjectURL(file));
    };


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
        if (!tagInput.trim()) return;
        setTags([...tags, tagInput.trim()]);
        setTagInput("");
    };

    const handleDeleteTag = (tag: string) => {
        setTags(tags.filter((t) => t !== tag));
    };

    const reset = () => {
        setTitle("");
        setSubtitle("");
        setCoverImage("");
        setBodyMd("");
        setReadTime("");
        setPublishDate("");
        setStatus('draft');
        setTags([]);
        setTagInput("");
        setImage(null);
    };

    React.useEffect(() => {
        if (initialData && open) {
            setTitle(initialData.title || "");
            setSubtitle(initialData.subtitle || "");
            setCoverImage(initialData.coverImage || "");
            setBodyMd(initialData.bodyMd || "");
            setReadTime(initialData.readTime || "");
            setPublishDate(initialData.publishDate || "");
            setStatus(initialData.status || 'draft');
            setTags(initialData.tags || []);
        } else if (open) {
            reset();
        }
    }, [initialData, open]);

    const handleSubmit = () => {
        if (!title.trim()) return;
        onSave({
            title,
            subtitle: subtitle || undefined,
            coverImage: coverImage || undefined,
            bodyMd: bodyMd || undefined,
            readTime: readTime || undefined,
            publishDate: publishDate || undefined,
            status,
            tags,
        });
        reset();
        onClose();
    };

    return (
        <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
            <DialogTitle sx={{ display: "flex", justifyContent: "space-between" }}>
                {initialData ? "Edit Article" : "Create New Article"} 📝
                <IconButton onClick={onClose}>
                    <CloseIcon />
                </IconButton>
            </DialogTitle>

            <DialogContent dividers>
                <Card sx={{ borderRadius: 3, boxShadow: 0 }}>
                    <CardContent>
                        <TextField
                            fullWidth
                            label="Article Title"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            sx={{ mb: 3 }}
                        />

                        <TextField
                            fullWidth
                            label="Subtitle"
                            value={subtitle}
                            onChange={(e) => setSubtitle(e.target.value)}
                            sx={{ mb: 3 }}
                        />

                        <TextField
                            fullWidth
                            label="Cover Image URL"
                            value={coverImage}
                            onChange={(e) => setCoverImage(e.target.value)}
                            sx={{ mb: 3 }}
                        />

                        <TextField
                            fullWidth
                            label="Publish Date (ISO)"
                            placeholder="2026-03-26T10:00:00.000Z"
                            value={publishDate}
                            onChange={(e) => setPublishDate(e.target.value)}
                            sx={{ mb: 3 }}
                        />

                        <TextField
                            fullWidth
                            label="Read Time"
                            placeholder="5 min read"
                            value={readTime}
                            onChange={(e) => setReadTime(e.target.value)}
                            sx={{ mb: 3 }}
                        />

                        <FormControl fullWidth sx={{ mb: 3 }}>
                            <InputLabel>Status</InputLabel>
                            <Select
                                value={status}
                                label="Status"
                                onChange={(e) => setStatus(e.target.value as 'published' | 'draft')}
                            >
                                <MenuItem value="published">Published</MenuItem>
                                <MenuItem value="draft">Draft</MenuItem>
                            </Select>
                        </FormControl>

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
                            label="Content (Markdown)"
                            multiline
                            rows={6}
                            value={bodyMd}
                            onChange={(e) => setBodyMd(e.target.value)}
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


                        <Box mb={3}>
                            <Typography mb={1}>Tags</Typography>

                            <Box display="flex" gap={1}>
                                <TextField
                                    fullWidth
                                    placeholder="Add tag..."
                                    value={tagInput}
                                    onChange={(e) => setTagInput(e.target.value)}
                                />
                                <Button variant="contained" onClick={handleAddTag}>
                                    Add
                                </Button>
                            </Box>

                            <Box mt={2} display="flex" gap={1} flexWrap="wrap">
                                {tags.map((tag) => (
                                    <Chip
                                        key={tag}
                                        label={tag}
                                        onDelete={() => handleDeleteTag(tag)}
                                    />
                                ))}
                            </Box>
                        </Box>

                        <Box display="flex" gap={2}>
                            <Button
                                variant="contained"
                                color="primary"
                                fullWidth
                                onClick={handleSubmit}
                                disabled={!title.trim()}
                            >
                                {initialData ? "Update" : "Save"}
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