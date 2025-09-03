import React, { useState } from "react";
import axios from "axios";
import {
  Box,
  Button,
  CircularProgress,
  Container,
  CssBaseline,
  GlobalStyles,
  IconButton,
  Input,
  Paper,
  Stack,
  Typography,
  Alert,
} from "@mui/material";
import { pink, purple, grey } from "@mui/material/colors";
import FileDownloadIcon from "@mui/icons-material/FileDownload";
import DeleteIcon from "@mui/icons-material/Delete";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import { getDocument, GlobalWorkerOptions } from "pdfjs-dist";

// PDF.js worker
GlobalWorkerOptions.workerSrc =
  "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.worker.min.js";

export default function App() {
  const [file, setFile] = useState(null);
  const [pdfThumbnail, setPdfThumbnail] = useState(null);
  const [loading, setLoading] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState(null);
  const [downloadFileName, setDownloadFileName] = useState("");
  const [history, setHistory] = useState([]);
  const [error, setError] = useState("");

  // Handle file selection
  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile && selectedFile.type === "application/pdf") {
      setFile(selectedFile);
      setError("");
      generateThumbnail(selectedFile);
    } else {
      setFile(null);
      setPdfThumbnail(null);
      setError("Please upload a valid PDF file.");
    }
  };

  // Generate PDF thumbnail
  const generateThumbnail = (file) => {
    const reader = new FileReader();
    reader.onload = async () => {
      const pdfData = new Uint8Array(reader.result);
      try {
        const pdf = await getDocument(pdfData).promise;
        const page = await pdf.getPage(1);
        const viewport = page.getViewport({ scale: 0.3 });
        const canvas = document.createElement("canvas");
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        await page.render({ canvasContext: canvas.getContext("2d"), viewport }).promise;
        setPdfThumbnail(canvas.toDataURL());
      } catch (err) {
        console.error(err);
        setError("Failed to generate thumbnail.");
      }
    };
    reader.readAsArrayBuffer(file);
  };

  // Upload & convert
  const handleUpload = async () => {
    if (!file) return setError("Select a PDF file first!");
    const formData = new FormData();
    formData.append("file", file);
    setLoading(true);
    setError("");
    try {
      const response = await axios.post("http://localhost:5000/convert", formData, {
        responseType: "blob",
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      setDownloadUrl(url);
      const pptName = `${file.name.replace(/\.[^/.]+$/, "")}.pptx`;
      setDownloadFileName(pptName);
      setHistory([...history, { name: pptName, url }]);
    } catch (err) {
      console.error(err);
      setError("Upload failed.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = () => {
    setFile(null);
    setPdfThumbnail(null);
    setDownloadUrl(null);
    setError("");
  };

  const handleDragOver = (e) => e.preventDefault();
  const handleDrop = (e) => {
    e.preventDefault();
    const selectedFile = e.dataTransfer.files[0];
    handleFileChange({ target: { files: [selectedFile] } });
  };

  return (
    <>
      <CssBaseline />
      <GlobalStyles
        styles={{
          "html, body, #root": { minHeight: "100%", overflowY: "auto" },
          body: {
            margin: 0,
            fontFamily: "'Poppins', sans-serif",
            background: "linear-gradient(135deg, #1c1b22 0%, #2c1b3f 100%)",
            position: "relative",
          },
          "*": { boxSizing: "border-box" },
        }}
      />
      <Box
        sx={{
          position: "fixed",
          inset: 0,
          background: "radial-gradient(circle at top left, rgba(255,255,255,0.05), transparent 70%)",
          pointerEvents: "none",
          zIndex: 0,
        }}
      />
      <Container maxWidth="lg" sx={{ py: 6, position: "relative", zIndex: 1 }}>
        <Stack spacing={6} direction={{ xs: "column", md: "row" }}>
          {/* Upload & Convert Card */}
          <Paper
            sx={{
              flex: 1,
              p: 5,
              borderRadius: 4,
              backdropFilter: "blur(12px)",
              backgroundColor: "rgba(30,30,40,0.75)",
              boxShadow: "0 10px 25px rgba(0,0,0,0.3)",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 4,
              transition: "transform 0.2s",
              "&:hover": { transform: "translateY(-4px)", boxShadow: "0 15px 30px rgba(0,0,0,0.4)" },
            }}
          >
            <Typography variant="h4" sx={{ color: pink[200], fontWeight: "bold" }}>
              PDF to PowerPoint
            </Typography>

            {/* Upload Dropzone */}
            <Box
              onClick={() => document.getElementById("file-input").click()}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              sx={{
                width: "100%",
                maxWidth: 400,
                p: 4,
                border: `2px dashed ${purple[400]}`,
                borderRadius: 3,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                transition: "all 0.3s ease",
                "&:hover": { borderColor: pink[300], backgroundColor: "rgba(50,50,60,0.85)" },
              }}
            >
              <IconButton>
                <UploadFileIcon sx={{ fontSize: 48, color: purple[200] }} />
              </IconButton>
              <Typography sx={{ mt: 1, color: grey[300] }}>Click or drag your PDF here</Typography>
              {pdfThumbnail && (
                <Box sx={{ mt: 3, width: "100%", maxWidth: 200, transition: "all 0.3s" }}>
                  <img
                    src={pdfThumbnail}
                    alt="PDF thumbnail"
                    style={{ width: "100%", borderRadius: 8, boxShadow: "0 0 12px rgba(186,104,200,0.4)" }}
                  />
                </Box>
              )}
            </Box>
            <Input id="file-input" type="file" sx={{ display: "none" }} onChange={handleFileChange} />

            <Button
              variant="contained"
              onClick={handleUpload}
              disabled={loading || !file}
              sx={{
                mt: 3,
                width: "100%",
                maxWidth: 400,
                py: 1.5,
                fontWeight: "bold",
                background: `linear-gradient(90deg, ${pink[400]}, ${purple[400]})`,
                transition: "all 0.3s ease",
                "&:hover": { background: `linear-gradient(90deg, ${pink[600]}, ${purple[600]})`, boxShadow: "0 0 12px rgba(244,143,177,0.4)" },
              }}
            >
              {loading ? <CircularProgress size={24} color="inherit" /> : "Convert to PPTX"}
            </Button>

            {downloadUrl && (
              <Button
                component="a"
                href={downloadUrl}
                download={downloadFileName}
                variant="contained"
                sx={{
                  mt: 2,
                  width: "100%",
                  maxWidth: 400,
                  py: 1.5,
                  fontWeight: "bold",
                  background: `linear-gradient(90deg, ${purple[400]}, ${pink[400]})`,
                  transition: "all 0.3s ease",
                  "&:hover": { background: `linear-gradient(90deg, ${purple[600]}, ${pink[600]})`, boxShadow: "0 0 12px rgba(186,104,200,0.4)" },
                }}
              >
                <FileDownloadIcon sx={{ mr: 1 }} />
                Download PPTX
              </Button>
            )}

            {file && (
              <Button
                variant="outlined"
                onClick={handleDelete}
                sx={{
                  mt: 2,
                  width: "100%",
                  maxWidth: 400,
                  py: 1.5,
                  color: pink[300],
                  borderColor: pink[300],
                  transition: "all 0.3s ease",
                  "&:hover": { color: pink[500], borderColor: pink[500] },
                }}
              >
                <DeleteIcon sx={{ mr: 1 }} />
                Delete PDF
              </Button>
            )}

            {error && <Alert severity="error">{error}</Alert>}
          </Paper>

          {/* Instructions & History */}
          <Stack flex={1} spacing={6}>
            {/* Instructions */}
            <Paper
              sx={{
                p: 4,
                borderRadius: 4,
                backdropFilter: "blur(12px)",
                backgroundColor: "rgba(30,30,40,0.75)",
                boxShadow: "0 8px 25px rgba(0,0,0,0.25)",
                transition: "transform 0.2s",
                "&:hover": { transform: "translateY(-3px)", boxShadow: "0 10px 30px rgba(0,0,0,0.3)" },
              }}
            >
              <Typography variant="h5" sx={{ color: pink[200], fontWeight: "bold", mb: 3 }}>
                How It Works
              </Typography>
              <Stack spacing={3}>
                <Stack direction="row" spacing={2} alignItems="center">
                  <UploadFileIcon sx={{ color: purple[200], fontSize: 36 }} />
                  <Typography color={grey[300]}>Upload your PDF file</Typography>
                </Stack>
                <Stack direction="row" spacing={2} alignItems="center">
                  <CircularProgress size={32} sx={{ color: purple[200] }} />
                  <Typography color={grey[300]}>Wait while it converts </Typography>
                </Stack>
                <Stack direction="row" spacing={2} alignItems="center">
                  <CheckCircleIcon sx={{ color: purple[200], fontSize: 36 }} />
                  <Typography color={grey[300]}>Download the resulting PPTX</Typography>
                </Stack>
              </Stack>
            </Paper>

            {/* History */}
            <Paper
              sx={{
                p: 4,
                borderRadius: 4,
                backdropFilter: "blur(12px)",
                backgroundColor: "rgba(30,30,40,0.75)",
                boxShadow: "inset 0 0 15px rgba(0,0,0,0.5)",
                maxHeight: 400,
                overflowY: "auto",
              }}
            >
              <Typography variant="h5" sx={{ color: pink[200], fontWeight: "bold", mb: 2 }}>
                Conversion History
              </Typography>
              {history.length === 0 && (
                <Typography color={grey[400]} textAlign="center">
                  No conversions yet.
                </Typography>
              )}
              <Stack spacing={2}>
                {history.map((item, index) => (
                  <Button
                    key={index}
                    variant="outlined"
                    component="a"
                    href={item.url}
                    download={item.name}
                    sx={{
                      justifyContent: "flex-start",
                      color: grey[100],
                      borderColor: purple[400],
                      textOverflow: "ellipsis",
                      overflow: "hidden",
                      whiteSpace: "nowrap",
                      transition: "all 0.3s ease",
                      "&:hover": { color: purple[300], borderColor: purple[600], boxShadow: "0 0 10px rgba(186,104,200,0.4)" },
                    }}
                  >
                    <FileDownloadIcon sx={{ mr: 1, color: purple[300] }} />
                    {item.name}
                  </Button>
                ))}
                {history.length > 0 && (
                  <Button
                    onClick={() => setHistory([])}
                    variant="outlined"
                    sx={{
                      mt: 2,
                      color: pink[300],
                      borderColor: pink[300],
                      "&:hover": { color: pink[500], borderColor: pink[500], boxShadow: "0 0 10px rgba(244,143,177,0.3)" },
                    }}
                  >
                    <DeleteIcon sx={{ mr: 1 }} />
                    Clear History
                  </Button>
                )}
              </Stack>
            </Paper>
          </Stack>
        </Stack>
      </Container>
    </>
  );
}
