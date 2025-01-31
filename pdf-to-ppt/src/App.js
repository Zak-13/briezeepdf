import React, { useState } from 'react';
import axios from 'axios';
import { Button, CircularProgress, Typography, Box, Container, Input, Alert, Paper, IconButton, Stack } from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import DeleteIcon from '@mui/icons-material/Delete';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { pink, teal, grey } from '@mui/material/colors';
import { getDocument, GlobalWorkerOptions } from 'pdfjs-dist';

// Ensure the worker is being loaded correctly from the installed pdfjs-dist package
GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.worker.min.js`;

function App() {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState(null);
  const [error, setError] = useState('');
  const [pdfThumbnail, setPdfThumbnail] = useState(null);
  const [downloadFileName, setDownloadFileName] = useState('');  // State for the download filename
  const [history, setHistory] = useState([]);  // History state to store converted files

  // Handle PDF file change
  const handleFileChange = async (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile && selectedFile.type === 'application/pdf') {
      setFile(selectedFile);
      setError(""); // Reset error if file is valid
      generatePdfThumbnail(selectedFile);  // Generate PDF thumbnail
    } else {
      setFile(null);
      setError("Please upload a valid PDF file.");
      setPdfThumbnail(null);  // Clear thumbnail on invalid file
    }
  };

  // Generate thumbnail of the first page of the PDF
  const generatePdfThumbnail = async (file) => {
    const reader = new FileReader();
    reader.onload = async () => {
      const pdfData = new Uint8Array(reader.result);
      try {
        const pdfDoc = await getDocument(pdfData).promise;
        const page = await pdfDoc.getPage(1);  // Get the first page
        const scale = 0.3;  // Scale down the page for a smaller preview
        const viewport = page.getViewport({ scale });

        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.height = viewport.height;
        canvas.width = viewport.width;

        await page.render({ canvasContext: context, viewport }).promise;

        // Convert canvas to image and store it
        const imgDataUrl = canvas.toDataURL();
        setPdfThumbnail(imgDataUrl);
      } catch (error) {
        console.error("Error generating PDF thumbnail:", error);
        setError("Error generating thumbnail.");
      }
    };
    reader.readAsArrayBuffer(file);
  };

  // Handle PDF Upload
  const handleUpload = async () => {
    if (!file) {
      setError("Please select a PDF file first!");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    setLoading(true);
    setError(""); // Reset error if a new file is uploaded

    try {
      const response = await axios.post('http://localhost:5000/convert', formData, {
        responseType: 'blob',  // Ensure we handle the file response as a blob
      });

      // Generate a download URL from the response blob
      const url = window.URL.createObjectURL(new Blob([response.data]));
      setDownloadUrl(url);  // Set the new download URL based on the unique PPTX file

      // Extract the file name from the uploaded PDF
      const pdfFileName = file.name.split('.').slice(0, -1).join('.');  // Remove file extension
      const pptFileName = `${pdfFileName}.pptx`;  // Create PPTX filename

      setDownloadFileName(pptFileName);  // Set the filename to the same name with .pptx extension

      // Add the converted file to history
      setHistory(prevHistory => [
        ...prevHistory,
        { name: pptFileName, url }
      ]);

    } catch (error) {
      console.error("Error during file upload:", error);
      setError("There was an error uploading the file.");
    } finally {
      setLoading(false);
    }
  };

  // Handle delete action
  const handleDelete = () => {
    setFile(null);  // Remove the uploaded file
    setPdfThumbnail(null);  // Clear the thumbnail
    setError("");  // Reset any error message
    setDownloadUrl(null);  // Clear any download URL
  };

  // Handle drag events
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
      setError("");
      generatePdfThumbnail(selectedFile);  // Generate PDF thumbnail
    } else {
      setFile(null);
      setError("Please upload a valid PDF file.");
      setPdfThumbnail(null);  // Clear thumbnail on invalid file
    }
  };

  return (
    <Container sx={{ paddingTop: 4, paddingBottom: 6 }}>
      <Stack direction="row" spacing={4} >
        <Paper sx={{
          padding: 4,
          borderRadius: 2,
          boxShadow: 3,
          zIndex: 3,
          textAlign: 'center',
          backgroundColor: '#505050', // Soft grayish background to match pastel goth
          border: `1px solid ${grey[700]}`,
        }}>

          <Typography variant="h4" color={pink[300]} gutterBottom sx={{ fontFamily: 'Creepster, sans-serif', fontWeight: 'bold' }}>
            PDF to PowerPoint Converter
          </Typography>

          <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" gap={3}>

            {/* File Upload Area */}
            <Box
              sx={{
                border: `2px dashed ${teal[400]}`,
                borderRadius: 2,
                padding: 4,
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                width: '100%',
                maxWidth: 400,
                cursor: 'pointer',
                transition: 'all 0.3s ease-in-out',
                '&:hover': { borderColor: teal[600], backgroundColor: '#383838' },
                flexDirection: 'column', // Stack content vertically
              }}
              onClick={() => document.getElementById('file-input').click()}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
            >
              <IconButton sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                <CloudUploadIcon sx={{ fontSize: 40, color: teal[300] }} />
              </IconButton>
              <Typography variant="body1" color={teal[300]} sx={{ textAlign: 'center' }}>
                Click or Drag your PDF here
              </Typography>

              {/* Show file preview if PDF is uploaded */}
              {pdfThumbnail && (
                <Box sx={{ marginTop: 2, width: '100%', maxWidth: 200 }}>
                  <img src={pdfThumbnail} alt="PDF Thumbnail" style={{ width: '100%', borderRadius: 8 }} />
                </Box>
              )}

              {/* Show file name if PDF is uploaded */}
              {file && !pdfThumbnail && (
                <Typography variant="body2" color="textSecondary" sx={{ marginTop: 2 }}>
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

            {/* Upload Button */}
            <Button
              variant="contained"
              color="primary"
              onClick={handleUpload}
              disabled={loading || !file}
              sx={{
                width: '100%',
                maxWidth: 400,
                padding: 2,
                borderRadius: 1,
                fontWeight: 'bold',
                fontSize: '16px',
                backgroundColor: pink[400],
                '&:hover': { backgroundColor: pink[600] },
                boxShadow: `0 4px 12px ${pink[300]}`,
              }}
            >
              {loading ? <CircularProgress size={24} color="inherit" /> : "Convert to PowerPoint"}
            </Button>

            {/* Error Alert */}
            {error && (
              <Alert severity="error" sx={{ width: '100%', maxWidth: 400 }}>
                {error}
              </Alert>
            )}

            {/* Download Button */}
            {downloadUrl && (
              <Box>
                <a href={downloadUrl} download={downloadFileName}>
                  <Button
                    variant="contained"
                    color="success"
                    sx={{
                      width: '100%',
                      maxWidth: 400,
                      padding: 2,
                      borderRadius: 1,
                      fontWeight: 'bold',
                      fontSize: '16px',
                      backgroundColor: teal[500],
                      '&:hover': { backgroundColor: teal[700] },
                    }}
                  >
                    <FileDownloadIcon sx={{ marginRight: 1 }} />
                    Download PowerPoint
                  </Button>
                </a>
              </Box>
            )}

            {/* Delete Button */}
            {file && (
              <Box sx={{ marginTop: 2 }}>
                <Button
                  variant="outlined"
                  color="error"
                  onClick={handleDelete}
                  sx={{
                    width: '100%',
                    maxWidth: 400,
                    padding: 2,
                    borderRadius: 1,
                    fontWeight: 'bold',
                    fontSize: '16px',
                    borderColor: pink[300],
                    color: pink[300],
                    '&:hover': { borderColor: pink[600], color: pink[600] },
                  }}
                >
                  <DeleteIcon sx={{ marginRight: 1 }} />
                  Delete PDF
                </Button>
              </Box>
            )}
          </Box>
        </Paper>

        {/* How to Convert Section */}
        <Stack>
        <Box sx={{
          padding: 4,
          borderRadius: 2,
          boxShadow: 3,
          zIndex: 3,
          textAlign: 'center',
          backgroundColor: '#505050', // Soft grayish background to match pastel goth
          border: `1px solid ${grey[700]}`,
        }}>
          
          <Typography variant="h5" color={pink[300]} gutterBottom>
            How to Convert Files
          </Typography>
          <Box display="flex" flexDirection="column" alignItems="center" gap={4}>
            <Box display="flex" alignItems="center" gap={2}>
              <CloudUploadIcon sx={{ fontSize: 40, color: teal[300] }} />
              <Typography variant="body1" color={grey[300]}>
                1. Upload your PDF file by clicking or dragging it here.
              </Typography>
            </Box>
            <Box display="flex" alignItems="center" gap={2}>
              <CircularProgress sx={{ color: teal[300] }} size={40} />
              <Typography variant="body1" color={grey[300]}>
                2. Wait as the file is processed and converted to PowerPoint.
              </Typography>
            </Box>
            <Box display="flex" alignItems="center" gap={2}>
              <CheckCircleIcon sx={{ fontSize: 40, color: teal[300] }} />
              <Typography variant="body1" color={grey[300]}>
                3. Download your PowerPoint file once the conversion is complete.
              </Typography>
            </Box>
          </Box>
        </Box>

        {/* History Section */}
        <Box sx={{ 
          padding: 4, 
          marginTop: 6, 
          zIndex: 3,
          borderRadius: 2 , flex: 1, 
          textAlign: 'center',
          backgroundColor: '#505050', // Soft grayish background to match pastel goth
          border: `1px solid ${grey[700]}`,
          boxShadow: 3,
          }}>
          <Typography variant="h5" color={pink[300]} gutterBottom>
            Conversion History
          </Typography>
          <Box>
            {history.length === 0 ? (
              <Typography variant="body1" color={grey[300]}>
                No conversion history found.
              </Typography>
            ) : (
              history.map((item, index) => (
                <Box key={index} sx={{ marginBottom: 2 }}>
                  <Button
                    variant="outlined"
                    color="primary"
                    href={item.url}
                    download={item.name}
                    sx={{
                      width: '100%',
                      maxWidth: 400,
                      padding: 2,
                      borderRadius: 1,
                      fontWeight: 'bold',
                      fontSize: '16px',
                      borderColor: teal[500],
                      color: teal[500],
                      '&:hover': { borderColor: teal[700], color: teal[700] },
                    }}
                  >
                    <FileDownloadIcon sx={{ marginRight: 1 }} />
                    {item.name}
                  </Button>
                </Box>
              ))
            )}
          </Box>
        </Box>
        </Stack>
      </Stack>  
    </Container>
  );
}

export default App;
