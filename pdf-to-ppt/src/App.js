import React, { useState } from "react";
import axios from "axios";
import {
  Button,
  CircularProgress,
  Typography,
  Box,
  Container,
  Input,
  Alert,
  Paper,
  IconButton,
  Stack,
  Divider,
  CssBaseline,
  GlobalStyles,
} from "@mui/material";
import FileDownloadIcon from "@mui/icons-material/FileDownload";
import DeleteIcon from "@mui/icons-material/Delete";
import PetsIcon from "@mui/icons-material/Pets";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import { pink, purple, grey } from "@mui/material/colors";
import { getDocument, GlobalWorkerOptions } from "pdfjs-dist";

// ✅ Fix pdf.js worker error
GlobalWorkerOptions.workerSrc =
  "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.worker.min.js";

function App() {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState(null);
  const [error, setError] = useState("");
  const [pdfThumbnail, setPdfThumbnail] = useState(null);
  const [downloadFileName, setDownloadFileName] = useState("");
  const [history, setHistory] = useState([]);

  // Handle PDF file change
  const handleFileChange = async (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile && selectedFile.type === "application/pdf") {
      setFile(selectedFile);
      setError("");
      generatePdfThumbnail(selectedFile);
    } else {
      setFile(null);
      setError("Please upload a valid PDF file.");
      setPdfThumbnail(null);
    }
  };

  // Generate PDF thumbnail
  const generatePdfThumbnail = async (file) => {
    const reader = new FileReader();
    reader.onload = async () => {
      const pdfData = new Uint8Array(reader.result);
      try {
        const pdfDoc = await getDocument(pdfData).promise;
        const page = await pdfDoc.getPage(1);
        const scale = 0.3;
        const viewport = page.getViewport({ scale });

        const canvas = document.createElement("canvas");
        const context = canvas.getContext("2d");
        canvas.height = viewport.height;
        canvas.width = viewport.width;

        await page.render({ canvasContext: context, viewport }).promise;
        setPdfThumbnail(canvas.toDataURL());
      } catch (err) {
        console.error("Error generating PDF thumbnail:", err);
        setError("Error generating thumbnail.");
      }
    };
    reader.readAsArrayBuffer(file);
  };

  // Upload & convert
  const handleUpload = async () => {
    if (!file) {
      setError("Please select a PDF file first!");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    setLoading(true);
    setError("");

    try {
      const response = await axios.post(
        "http://localhost:5000/convert",
        formData,
        { responseType: "blob" }
      );

      const url = window.URL.createObjectURL(new Blob([response.data]));
      setDownloadUrl(url);

      const pdfFileName = file.name.split(".").slice(0, -1).join(".");
      const pptFileName = `${pdfFileName}.pptx`;
      setDownloadFileName(pptFileName);

      setHistory((prev) => [...prev, { name: pptFileName, url }]);
    } catch (err) {
      console.error("Error during file upload:", err);
      setError("There was an error uploading the file.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = () => {
    setFile(null);
    setPdfThumbnail(null);
    setError("");
    setDownloadUrl(null);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const selectedFile = e.dataTransfer.files[0];
    if (selectedFile && selectedFile.type === "application/pdf") {
      setFile(selectedFile);
      setError("");
      generatePdfThumbnail(selectedFile);
    } else {
      setFile(null);
      setError("Please upload a valid PDF file.");
      setPdfThumbnail(null);
    }
  };

  return (
    <>
      {/* Normalize + force global page scroll even if something set overflow hidden */}
      <CssBaseline />
      <GlobalStyles
        styles={{
          "html, body, #root": {
            height: "auto",
            minHeight: "100%",
            overflowY: "auto",
          },
          body: {
            margin: 0,
            backgroundColor: "#000000",
            color: grey[100],
          },
          "*": { boxSizing: "border-box" },
        }}
      />

      <Container
        component="main"
        maxWidth="lg"
        sx={{
          py: { xs: 4, md: 6 },
          fontFamily: "'Poppins', sans-serif",
        }}
      >
        {/* Themed scrollbars (Chrome/Edge/Safari + Firefox) */}
        <style>
          {`
            /* Chrome/Edge/Safari */
            ::-webkit-scrollbar { width: 10px; }
            ::-webkit-scrollbar-track { background: #111; }
            ::-webkit-scrollbar-thumb {
              background: linear-gradient(${pink[400]}, ${purple[400]});
              border-radius: 5px;
            }
            ::-webkit-scrollbar-thumb:hover {
              background: linear-gradient(${pink[600]}, ${purple[600]});
            }
            /* Firefox */
            * { scrollbar-width: thin; scrollbar-color: ${pink[400]} #111; }
          `}
        </style>

        <Stack
          direction={{ xs: "column", md: "row" }}
          spacing={6}
          alignItems="flex-start"
        >
          {/* Upload Section */}
          <Paper
            sx={{
              flex: 1,
              p: { xs: 3, md: 5 },
              borderRadius: 4,
              boxShadow: "0 0 30px rgba(186,104,200,0.3)",
              textAlign: "center",
              background: "linear-gradient(160deg, #000000, #1a001f)",
              border: `1px solid ${purple[800]}`,
              transition: "transform 0.2s ease",
              "&:hover": { transform: "translateY(-4px)" },
            }}
          >
            <Typography
              variant="h4"
              gutterBottom
              sx={{
                fontWeight: "bold",
                color: pink[200],
                textShadow: "0 0 6px rgba(244,143,177,0.6)",
              }}
            >
              PDF ➝ PowerPoint
            </Typography>
            <Divider sx={{ mb: 4, borderColor: purple[700] }} />

            <Box
              sx={{
                border: `2px dashed ${purple[400]}`,
                borderRadius: 3,
                p: { xs: 3, md: 5 },
                mb: 4,
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                width: "100%",
                maxWidth: 420,
                mx: "auto",
                cursor: "pointer",
                transition: "all 0.3s ease-in-out",
                "&:hover": {
                  borderColor: pink[300],
                  backgroundColor: "#111",
                  boxShadow: "0 0 18px rgba(244,143,177,0.3)",
                },
                flexDirection: "column",
              }}
              onClick={() => document.getElementById("file-input").click()}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
            >
              <IconButton>
                <PetsIcon sx={{ fontSize: 48, color: purple[200] }} />
              </IconButton>
              <Typography variant="body1" sx={{ color: purple[200] }}>
                Click or Drag your PDF here
              </Typography>

              {pdfThumbnail && (
                <Box sx={{ mt: 3, width: "100%", maxWidth: 220 }}>
                  <img
                    src={pdfThumbnail}
                    alt="PDF Thumbnail"
                    style={{
                      width: "100%",
                      borderRadius: 12,
                      boxShadow: "0 0 12px rgba(186,104,200,0.4)",
                    }}
                  />
                </Box>
              )}

              {file && !pdfThumbnail && (
                <Typography variant="body2" sx={{ color: grey[400], mt: 2 }}>
                  {file.name}
                </Typography>
              )}
            </Box>

            <Input
              type="file"
              id="file-input"
              accept=".pdf"
              onChange={handleFileChange}
              sx={{ display: "none" }}
            />

            <Stack spacing={2} alignItems="center">
              <Button
                variant="contained"
                onClick={handleUpload}
                disabled={loading || !file}
                sx={{
                  width: "100%",
                  maxWidth: 420,
                  py: 1.6,
                  borderRadius: 2,
                  fontWeight: "bold",
                  fontSize: "16px",
                  background: `linear-gradient(90deg, ${pink[400]}, ${purple[400]})`,
                  "&:hover": {
                    background: `linear-gradient(90deg, ${pink[500]}, ${purple[600]})`,
                    boxShadow: "0 0 18px rgba(244,143,177,0.4)",
                  },
                }}
              >
                {loading ? (
                  <CircularProgress size={24} color="inherit" />
                ) : (
                  "Convert to PowerPoint"
                )}
              </Button>

              {error && (
                <Alert severity="error" sx={{ width: "100%", maxWidth: 420 }}>
                  {error}
                </Alert>
              )}

              {downloadUrl && (
                <a href={downloadUrl} download={downloadFileName}>
                  <Button
                    variant="contained"
                    sx={{
                      width: "100%",
                      maxWidth: 420,
                      py: 1.6,
                      borderRadius: 2,
                      fontWeight: "bold",
                      fontSize: "16px",
                      mt: 1,
                      background: `linear-gradient(90deg, ${purple[400]}, ${pink[400]})`,
                      "&:hover": {
                        background: `linear-gradient(90deg, ${purple[600]}, ${pink[600]})`,
                        boxShadow: "0 0 18px rgba(186,104,200,0.4)",
                      },
                    }}
                  >
                    <FileDownloadIcon sx={{ mr: 1 }} />
                    Download PowerPoint
                  </Button>
                </a>
              )}

              {file && (
                <Button
                  variant="outlined"
                  onClick={handleDelete}
                  sx={{
                    width: "100%",
                    maxWidth: 420,
                    py: 1.6,
                    borderRadius: 2,
                    fontWeight: "bold",
                    borderColor: pink[300],
                    color: pink[300],
                    "&:hover": {
                      borderColor: pink[500],
                      color: pink[500],
                      boxShadow: "0 0 12px rgba(244,143,177,0.4)",
                    },
                  }}
                >
                  <DeleteIcon sx={{ mr: 1 }} />
                  Delete PDF
                </Button>
              )}
            </Stack>
          </Paper>

          {/* Instructions + History */}
          <Stack spacing={6} sx={{ flex: 1, width: "100%" }}>
            {/* Instructions */}
            <Paper
              sx={{
                p: { xs: 3, md: 4 },
                borderRadius: 4,
                background: "linear-gradient(160deg, #000000, #1a001f)",
                border: `1px solid ${purple[800]}`,
                boxShadow: "0 0 30px rgba(186,104,200,0.2)",
              }}
            >
              <Typography
                variant="h5"
                gutterBottom
                sx={{
                  color: pink[200],
                  fontWeight: "bold",
                  textShadow: "0 0 6px rgba(244,143,177,0.5)",
                }}
              >
                How it Works
              </Typography>
              <Stack spacing={3} mt={3}>
                <Box display="flex" alignItems="center" gap={2}>
                  <PetsIcon sx={{ fontSize: 36, color: purple[200] }} />
                  <Typography sx={{ color: grey[300] }}>
                    1. Upload your PDF file.
                  </Typography>
                </Box>
                <Box display="flex" alignItems="center" gap={2}>
                  <CircularProgress sx={{ color: purple[200] }} size={32} />
                  <Typography sx={{ color: grey[300] }}>
                    2. Wait for processing & conversion.
                  </Typography>
                </Box>
                <Box display="flex" alignItems="center" gap={2}>
                  <CheckCircleIcon sx={{ fontSize: 36, color: purple[200] }} />
                  <Typography sx={{ color: grey[300] }}>
                    3. Download your new PowerPoint.
                  </Typography>
                </Box>
              </Stack>
            </Paper>

            {/* Conversion History */}
            <Paper
              sx={{
                p: { xs: 3, md: 4 },
                borderRadius: 4,
                background: "linear-gradient(160deg, #000000, #1a001f)",
                border: `1px solid ${purple[800]}`,
                boxShadow: "inset 0 0 18px rgba(0,0,0,0.6)",
                maxHeight: 400,
                overflowY: "auto", // scroll inside
              }}
            >
              <Typography
                sx={{
                  color: pink[200],
                  mb: 3,
                  textAlign: "center",
                  fontWeight: "bold",
                  textShadow: "0 0 6px rgba(244,143,177,0.5)",
                }}
              >
                Conversion History
              </Typography>
              <Stack spacing={2}>
                {history.length === 0 ? (
                  <Typography sx={{ color: grey[400], textAlign: "center" }}>
                    No conversions yet.
                  </Typography>
                ) : (
                  <>
                    {history.map((item, index) => (
                      <Button
                        key={index}
                        variant="outlined"
                        href={item.url}
                        download={item.name}
                        sx={{
                          width: "100%",
                          color: grey[100],
                          borderColor: purple[400],
                          justifyContent: "flex-start",
                          textOverflow: "ellipsis",
                          overflow: "hidden",
                          whiteSpace: "nowrap",
                          transition: "all 0.3s ease",
                          "&:hover": {
                            borderColor: purple[600],
                            color: purple[300],
                            boxShadow: "0 0 12px rgba(186,104,200,0.6)",
                          },
                        }}
                      >
                        <FileDownloadIcon sx={{ mr: 1, color: purple[300] }} />
                        {item.name}
                      </Button>
                    ))}
                    <Button
                      onClick={() => setHistory([])}
                      sx={{
                        mt: 2,
                        width: "100%",
                        borderColor: pink[300],
                        color: pink[300],
                        "&:hover": {
                          borderColor: pink[500],
                          color: pink[500],
                          boxShadow: "0 0 12px rgba(244,143,177,0.4)",
                        },
                      }}
                    >
                      <DeleteIcon sx={{ mr: 1 }} /> Clear History
                    </Button>
                  </>
                )}
              </Stack>
            </Paper>
          </Stack>
        </Stack>
      </Container>
    </>
  );
}

export default App;
