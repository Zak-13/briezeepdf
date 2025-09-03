import React, { useState } from 'react';
import axios from 'axios';
import {
  Button, CircularProgress, Typography, Box, Container,
  Input, Alert, Paper, IconButton, Stack
} from '@mui/material';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import DeleteIcon from '@mui/icons-material/Delete';
import PetsIcon from '@mui/icons-material/Pets';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { pink, purple, grey } from '@mui/material/colors';
import { getDocument, GlobalWorkerOptions } from 'pdfjs-dist';

// ✅ Fix pdf.js worker error
GlobalWorkerOptions.workerSrc =
  `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.worker.min.js`;

function App() {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState(null);
  const [error, setError] = useState('');
  const [pdfThumbnail, setPdfThumbnail] = useState(null);
  const [downloadFileName, setDownloadFileName] = useState('');
  const [history, setHistory] = useState([]);

  // Handle PDF file change
  const handleFileChange = async (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile && selectedFile.type === 'application/pdf') {
      setFile(selectedFile);
      setError('');
      generatePdfThumbnail(selectedFile);
    } else {
      setFile(null);
      setError('Please upload a valid PDF file.');
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

        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.height = viewport.height;
        canvas.width = viewport.width;

        await page.render({ canvasContext: context, viewport }).promise;
        setPdfThumbnail(canvas.toDataURL());
      } catch (err) {
        console.error('Error generating PDF thumbnail:', err);
        setError('Error generating thumbnail.');
      }
    };
    reader.readAsArrayBuffer(file);
  };

  // Upload & convert
  const handleUpload = async () => {
    if (!file) {
      setError('Please select a PDF file first!');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);

    setLoading(true);
    setError('');

    try {
      const response = await axios.post('http://localhost:5000/convert', formData, {
        responseType: 'blob',
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      setDownloadUrl(url);

      const pdfFileName = file.name.split('.').slice(0, -1).join('.');
      const pptFileName = `${pdfFileName}.pptx`;
      setDownloadFileName(pptFileName);

      setHistory((prev) => [...prev, { name: pptFileName, url }]);
    } catch (err) {
      console.error('Error during file upload:', err);
      setError('There was an error uploading the file.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = () => {
    setFile(null);
    setPdfThumbnail(null);
    setError('');
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
    if (selectedFile && selectedFile.type === 'application/pdf') {
      setFile(selectedFile);
      setError('');
      generatePdfThumbnail(selectedFile);
    } else {
      setFile(null);
      setError('Please upload a valid PDF file.');
      setPdfThumbnail(null);
    }
  };

  return (
    <Container
      sx={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        overflowY: 'auto',
        paddingTop: 4,
        paddingBottom: 6,
      }}
    >
      <Stack
        direction={{ xs: 'column', md: 'row' }}
        spacing={4}
        sx={{ flexGrow: 1 }}
      >
        {/* Upload Section */}
        <Paper
          sx={{
            p: 4,
            borderRadius: 2,
            boxShadow: 3,
            zIndex: 3,
            textAlign: 'center',
            backgroundColor: '#000000', // black gothic
            border: `1px solid ${purple[900]}`,
          }}
        >
          <Typography
            variant="h4"
            gutterBottom
            sx={{
              fontFamily: 'Arial, sans-serif',
              fontWeight: 'bold',
              color: pink[200],
            }}
          >
            PDF to PowerPoint Converter
          </Typography>

          <Box
            display="flex"
            flexDirection="column"
            alignItems="center"
            justifyContent="center"
            gap={3}
          >
            {/* File Upload */}
            <Box
              sx={{
                border: `2px dashed ${purple[300]}`,
                borderRadius: 2,
                p: 4,
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                width: '100%',
                maxWidth: 400,
                cursor: 'pointer',
                transition: 'all 0.3s ease-in-out',
                '&:hover': {
                  borderColor: purple[500],
                  backgroundColor: '#1A1A1A',
                },
                flexDirection: 'column',
              }}
              onClick={() => document.getElementById('file-input').click()}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
            >
              <IconButton>
                <PetsIcon sx={{ fontSize: 40, color: purple[200] }} />
              </IconButton>
              <Typography
                variant="body1"
                sx={{ color: purple[200], textAlign: 'center' }}
              >
                Click or Drag your PDF here
              </Typography>

              {pdfThumbnail && (
                <Box sx={{ mt: 2, width: '100%', maxWidth: 200 }}>
                  <img
                    src={pdfThumbnail}
                    alt="PDF Thumbnail"
                    style={{ width: '100%', borderRadius: 8 }}
                  />
                </Box>
              )}

              {file && !pdfThumbnail && (
                <Typography variant="body2" sx={{ color: grey[300], mt: 2 }}>
                  {file.name}
                </Typography>
              )}
            </Box>

            <Input
              type="file"
              id="file-input"
              accept=".pdf"
              onChange={handleFileChange}
              sx={{ display: 'none' }}
            />

            {/* Convert Button */}
            <Button
              variant="contained"
              onClick={handleUpload}
              disabled={loading || !file}
              sx={{
                width: '100%',
                maxWidth: 400,
                p: 2,
                borderRadius: 1,
                fontWeight: 'bold',
                fontSize: '16px',
                backgroundColor: pink[400],
                '&:hover': { backgroundColor: pink[600] },
                boxShadow: `0 4px 12px ${pink[300]}`,
              }}
            >
              {loading ? (
                <CircularProgress size={24} color="inherit" />
              ) : (
                'Convert to PowerPoint'
              )}
            </Button>

            {error && (
              <Alert severity="error" sx={{ width: '100%', maxWidth: 400 }}>
                {error}
              </Alert>
            )}

            {downloadUrl && (
              <Box>
                <a href={downloadUrl} download={downloadFileName}>
                  <Button
                    variant="contained"
                    sx={{
                      width: '100%',
                      maxWidth: 400,
                      p: 2,
                      borderRadius: 1,
                      fontWeight: 'bold',
                      fontSize: '16px',
                      backgroundColor: purple[400],
                      '&:hover': { backgroundColor: purple[600] },
                    }}
                  >
                    <FileDownloadIcon sx={{ mr: 1 }} />
                    Download PowerPoint
                  </Button>
                </a>
              </Box>
            )}

            {file && (
              <Box sx={{ mt: 2 }}>
                <Button
                  variant="outlined"
                  onClick={handleDelete}
                  sx={{
                    width: '100%',
                    maxWidth: 400,
                    p: 2,
                    borderRadius: 1,
                    fontWeight: 'bold',
                    fontSize: '16px',
                    borderColor: pink[300],
                    color: pink[300],
                    '&:hover': { borderColor: pink[600], color: pink[600] },
                  }}
                >
                  <DeleteIcon sx={{ mr: 1 }} />
                  Delete PDF
                </Button>
              </Box>
            )}
          </Box>
        </Paper>

        {/* Instructions + History */}
        <Stack sx={{ flex: 1 }}>
          {/* How to Convert */}
          <Box
            sx={{
              p: 4,
              borderRadius: 2,
              boxShadow: 3,
              textAlign: 'center',
              backgroundColor: '#000000',
              border: `1px solid ${purple[900]}`,
            }}
          >
            <Typography
              variant="h5"
              gutterBottom
              sx={{ color: pink[200], fontFamily: 'Arial, sans-serif' }}
            >
              How to Convert Files
            </Typography>
            <Box
              display="flex"
              flexDirection="column"
              alignItems="center"
              gap={4}
            >
              <Box display="flex" alignItems="center" gap={2}>
                <PetsIcon sx={{ fontSize: 40, color: purple[200] }} />
                <Typography sx={{ color: grey[300] }}>
                  1. Upload your PDF file by clicking or dragging it here.
                </Typography>
              </Box>
              <Box display="flex" alignItems="center" gap={2}>
                <CircularProgress sx={{ color: purple[200] }} size={40} />
                <Typography sx={{ color: grey[300] }}>
                  2. Wait as the file is processed and converted to PowerPoint.
                </Typography>
              </Box>
              <Box display="flex" alignItems="center" gap={2}>
                <CheckCircleIcon sx={{ fontSize: 40, color: purple[200] }} />
                <Typography sx={{ color: grey[300] }}>
                  3. Download your PowerPoint file once the conversion is
                  complete.
                </Typography>
              </Box>
            </Box>
          </Box>

          {/* Conversion History */}
          <Box
            sx={{
              p: 4,
              mt: 6,
              borderRadius: 2,
              backgroundColor: '#000000',
              border: `1px solid ${purple[900]}`,
              boxShadow: 'inset 0 0 10px rgba(0,0,0,0.3)',
              maxHeight: 400,
              overflowY: 'auto',
              flex: 1,
            }}
          >
            <Typography
              sx={{
                color: pink[200],
                mb: 2,
                textAlign: 'center',
                fontFamily: 'Arial, sans-serif',
              }}
            >
              Conversion History
            </Typography>
            <Stack spacing={1}>
              {history.length === 0 ? (
                <Typography
                  sx={{ color: grey[300], textAlign: 'center' }}
                >
                  No conversion history found.
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
                        width: '100%',
                        color: grey[100],
                        borderColor: purple[300],
                        textOverflow: 'ellipsis',
                        overflow: 'hidden',
                        whiteSpace: 'nowrap',
                        transition: 'all 0.3s ease',
                        '&:hover': {
                          borderColor: purple[500],
                          color: purple[500],
                          boxShadow: '0 0 12px #BA68C8',
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
                      width: '100%',
                      borderColor: pink[300],
                      color: pink[300],
                      '&:hover': {
                        borderColor: pink[600],
                        color: pink[600],
                        boxShadow: '0 0 12px #F48FB1',
                      },
                    }}
                  >
                    <DeleteIcon sx={{ mr: 1 }} /> Clear History
                  </Button>
                </>
              )}
            </Stack>
          </Box>
        </Stack>
      </Stack>
    </Container>
  );
}

export default App;
