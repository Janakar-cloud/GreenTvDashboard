import React, { useRef, useState } from "react";
import { $patchStyleText } from "@lexical/selection";
import { $generateHtmlFromNodes } from "@lexical/html";
import { ListNode, ListItemNode } from "@lexical/list";
import { ListPlugin } from "@lexical/react/LexicalListPlugin";
import { LexicalComposer } from "@lexical/react/LexicalComposer";
import { HistoryPlugin } from "@lexical/react/LexicalHistoryPlugin";
import { OnChangePlugin } from "@lexical/react/LexicalOnChangePlugin";
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import { LexicalErrorBoundary } from "@lexical/react/LexicalErrorBoundary";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { $getRoot, $isRangeSelection, $getSelection, FORMAT_TEXT_COMMAND, FORMAT_ELEMENT_COMMAND } from "lexical";

import CloseIcon from "@mui/icons-material/Close";
import {
    Box,
    Card,
    Chip,
    Alert,
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
    LinearProgress,
} from "@mui/material";

import { uploadToSignedUrlWithProgress } from "src/api/client";
import { type ArticleItem, type ArticlePayload, requestArticleUpload } from "src/api/articles";

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
    const [bodyHtml, setBodyHtml] = useState("");
    const [readTime, setReadTime] = useState("");
    const [status, setStatus] = useState<'published' | 'draft'>('draft');
    const [tagInput, setTagInput] = useState("");
    const [tags, setTags] = useState<string[]>([]);
    const [image, setImage] = useState<string | null>(null);
    const [coverFile, setCoverFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [uploadError, setUploadError] = useState<string | null>(null);

    const fileRef = useRef<HTMLInputElement | null>(null);

    const handleImage = (file?: File) => {
        if (!file || !file.type.startsWith("image/")) return;
        setCoverFile(file);
        if (image) URL.revokeObjectURL(image);
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
        setBodyHtml("");
        setReadTime("");
        setStatus('draft');
        setTags([]);
        setTagInput("");
        setImage(null);
        setCoverFile(null);
        setUploading(false);
        setUploadProgress(0);
        setUploadError(null);
    };

    React.useEffect(() => {
        if (initialData && open) {
            setTitle(initialData.title || "");
            setSubtitle(initialData.subtitle || "");
            setCoverImage(initialData.coverImage || "");
            setBodyMd(initialData.bodyMd || "");
            setReadTime(initialData.readTime || "");
            setStatus(initialData.status || 'draft');
            // Tags may be populated objects from the API — normalise to plain name strings
            setTags(
                (initialData.tags || []).map((t) =>
                    typeof t === 'string' ? t : (t as any).name ?? ''
                ).filter(Boolean)
            );
        } else if (open) {
            reset();
        }
    }, [initialData, open]);

    const handleSubmit = async () => {
        if (!title.trim()) return;
        setUploading(true);
        setUploadError(null);
        setUploadProgress(0);
        try {
            let finalCoverImage = coverImage;
            let finalBodyHtml: string | undefined;
            const publishDate = new Date().toISOString();

            // 1. Upload cover image to S3 if a new file was selected
            if (coverFile) {
                const presign = await requestArticleUpload(
                    `articles/covers`,
                    coverFile.type,
                );
                await uploadToSignedUrlWithProgress(presign.url, coverFile, (pct) =>
                    setUploadProgress(Math.round(pct * 0.5))
                );
                finalCoverImage = presign.fileUrl;
            }

            // 2. Upload HTML content to S3 if body has content
            if (bodyHtml.trim() && bodyHtml !== '<p></p>') {
                const htmlBlob = new Blob([bodyHtml], { type: 'text/html' });
                const htmlFile = new File([htmlBlob], 'content.html', { type: 'text/html' });
                const presign = await requestArticleUpload(`articles/content`, 'text/html');
                await uploadToSignedUrlWithProgress(presign.url, htmlFile, (pct) =>
                    setUploadProgress(50 + Math.round(pct * 0.5))
                );
                finalBodyHtml = presign.fileUrl;
            }

            onSave({
                title,
                subtitle: subtitle || undefined,
                coverImage: finalCoverImage || undefined,
                bodyMd: bodyMd || undefined,
                bodyHtml: finalBodyHtml,
                readTime: readTime || undefined,
                publishDate: publishDate || undefined,
                status,
                tags,
            });
            reset();
            onClose();
        } catch (err) {
            setUploadError(err instanceof Error ? err.message : 'Upload failed');
        } finally {
            setUploading(false);
        }
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

                        <FormControl fullWidth sx={{ mb: 3 }}>
                            <InputLabel>Read Time</InputLabel>
                            <Select
                                value={readTime}
                                label="Read Time"
                                onChange={(e) => setReadTime(e.target.value)}
                            >
                                <MenuItem value="5 mins">5 mins</MenuItem>
                                <MenuItem value="10 mins">10 mins</MenuItem>
                                <MenuItem value="15 mins">15 mins</MenuItem>
                                <MenuItem value="30 mins">30 mins</MenuItem>
                                <MenuItem value="45 mins">45 mins</MenuItem>
                                <MenuItem value="1 hour">1 hour</MenuItem>
                            </Select>
                        </FormControl>

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
                                                const text = $getRoot().getTextContent();
                                                setBodyMd(text);
                                                const html = $generateHtmlFromNodes(editor, null);
                                                setBodyHtml(html);
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

                        {uploadError && (
                            <Alert severity="error" sx={{ mb: 2 }}>{uploadError}</Alert>
                        )}

                        {uploading && (
                            <Box sx={{ mb: 2 }}>
                                <Typography variant="body2" color="text.secondary" mb={0.5}>
                                    Uploading... {uploadProgress}%
                                </Typography>
                                <LinearProgress variant="determinate" value={uploadProgress} />
                            </Box>
                        )}

                        <Box display="flex" gap={2}>
                            <Button
                                variant="contained"
                                color="primary"
                                fullWidth
                                onClick={handleSubmit}
                                disabled={!title.trim() || uploading}
                            >
                                {uploading ? `Uploading ${uploadProgress}%` : (initialData ? "Update" : "Save")}
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