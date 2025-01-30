
# PDF to PowerPoint Converter

This project is a web application that allows users to upload PDF files and convert them into PowerPoint presentations (PPTX). The backend is built using Flask (Python), and the frontend is React.JS that interacts with the backend.


## Requirements

Before you start, ensure you have the following installed on your machine:

    Download Node.js and npm: https://nodejs.org/

    Python 3.7+ (can be installed from https://www.python.org/)
    
    pip (Python package installer)
## Overview
The PDF to PowerPoint Converter is a tool that takes a PDF file and converts each page into an image, then inserts these images into PowerPoint slides. The process is handled by the backend server, which returns the PowerPoint file to the user for download.

## Overview to Run
Summary of Steps to Run the Code:

    Install Node.js and npm.

    Install React/JS dependencies (axios, @mui/material, pdfjs-dist).

    Install Python dependencies (Flask flask-cors PyMuPDF python-pptx pillow)

    Run the Flask backend (python app.py) and ensure it's working on http://localhost:5000.

    Launch the React app (npm start) and access it via http://localhost:3000.
    
    Ensure the React app and Flask API can communicate properly (i.e., correct API URL and CORS configuration).
## Run Locally Expanded

Clone the project

```bash
  git clone https://github.com/yourusername/pdf-to-ppt.git

```

Go to the project directory

```bash
  cd pdf-to-ppt

```

Install dependencies

```bash
  npm install

  pip install Flask flask_cors PyMuPDF python-pptx Pillow

```

Start the Front End

```bash
  npm start

```

Start the Back End

```bash
python app.py

```

## API Reference
POST /convert

This endpoint allows users to upload a PDF file and receive the converted PowerPoint presentation (PPTX) in response.
Request

    Method: POST
    URL: /convert
    Headers:
        Content-Type: multipart/form-data

Form Data Parameters

    file (required): The PDF file to be converted. This file should be included in the multipart/form-data body of the request.

Example Request

POST http://127.0.0.1:5000/convert
Content-Type: multipart/form-data

--boundary
Content-Disposition: form-data; name="file"; filename="sample.pdf"
Content-Type: application/pdf

<PDF file content>
--boundary--

Response

    Status Code: 200 OK (If the conversion is successful)
    Content-Type: application/vnd.openxmlformats-officedocument.presentationml.presentation (PPTX file)
    Body: The converted PowerPoint file (PPTX) containing images of the PDF pages.

Example Response

If the conversion is successful, the server responds with the PPTX file.

HTTP/1.1 200 OK
Content-Type: application/vnd.openxmlformats-officedocument.presentationml.presentation
Content-Disposition: attachment; filename="converted_presentation.pptx"

<PowerPoint file content>

Error Responses

    Status Code: 400 Bad Request
        Description: The request is missing the file or the file is not in the expected format.
        Response Body:

    {
      "error": "No file part"
    }

Status Code: 500 Internal Server Error

    Description: An unexpected error occurred during the conversion.
    Response Body:

        {
          "error": "Internal server error: <error details>"
        }

Example Usage

    Upload a PDF file using a form (HTML) or using a tool like Postman or cURL.
    Receive the converted PPTX file as the response, which can be downloaded and opened with PowerPoint.
# ---- React Documentation ----

Key Components & Code Breakdown
## Imports
#### React & Material-UI: React for building the UI, @mui/material for components (Button, Alert, Typography, etc.), and @mui/icons-material for the icons used in the UI.
#### axios: For making HTTP requests to the Flask backend.
#### pdfjs-dist: For generating the PDF thumbnail (first page preview).
#### Colors: pink, teal, and grey for styling.

```
import React, { useState } from 'react';
import axios from 'axios';
import { Button, CircularProgress, Typography, Box, Container, Input, Alert, Paper, IconButton, Stack } from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import DeleteIcon from '@mui/icons-material/Delete';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { pink, teal, grey } from '@mui/material/colors';
import { getDocument, GlobalWorkerOptions } from 'pdfjs-dist';
```
    
## App Component
### useState hooks are used to manage the state of various components:
#### file: Stores the uploaded PDF file.
#### loading: Indicates whether the app is waiting for the conversion to complete.
#### downloadUrl: Stores the URL for downloading the converted PPTX.
#### error: Stores any error message related to file upload or conversion.
#### pdfThumbnail: Stores the thumbnail image data for the uploaded PDF.
#### downloadFileName: Stores the name of the converted PowerPoint file.
#### history: Stores a list of previously converted files with download links.
```
function App() {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState(null);
  const [error, setError] = useState('');
  const [pdfThumbnail, setPdfThumbnail] = useState(null);
  const [downloadFileName, setDownloadFileName] = useState('');  
  const [history, setHistory] = useState([]);
```
    

## Handle File Change (handleFileChange)
#### Functionality: Handles the file change event when a user selects a file.
#### Validations: Checks if the uploaded file is a valid PDF. If so, it updates the file state and generates a thumbnail. If not, it clears the file state and sets an error message.
```
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
```

## Generate PDF Thumbnail (generatePdfThumbnail)
#### Functionality: Generates a thumbnail of the first page of the uploaded PDF using pdfjs-dist.
#### Canvas: Renders the first page of the PDF to a canvas element, scales it down, and converts it into a Data URL that can be displayed as an image.
```
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
```

## Handle Upload (handleUpload)
#### Functionality: Sends the uploaded PDF to the backend for conversion.
#### Response Handling: Once the backend responds with a converted PowerPoint file, the Blob is used to create a download URL.
#### History: The file is added to the history state to keep track of previously converted files.
```
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
```

## Handle Delete (handleDelete)
#### Functionality: Clears the uploaded file, thumbnail, error, and download URL.
```
const handleDelete = () => {
  setFile(null);  // Remove the uploaded file
  setPdfThumbnail(null);  // Clear the thumbnail
  setError("");  // Reset any error message
  setDownloadUrl(null);  // Clear any download URL
};
```
    

## Drag and Drop Handlers

#### Functionality: Handles the drag-and-drop file upload. Ensures only PDFs can be dropped.

```
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
```
  

## Render UI

### The render method returns the JSX structure to display the UI components.

#### Container: Wraps the content of the app with padding and background color.

#### Paper: Contains the form elements like upload area, conversion button, error alert, and download button.

#### Icons and Buttons: For user interaction like upload, delete, download, etc.

#### Stack: Used to align content vertically or horizontally with proper spacing.
```
return (
  <Container sx={{ paddingTop: 4, paddingBottom: 6, backgroundColor: '#3e3e42' }}>
    <Stack direction="row" spacing={4}>
      {/* Main UI Structure with Material-UI components like Paper, Typography, Box, etc. */}
    </Stack>
  </Container>
);
```
    

## Conversion History Section

### This section displays a list of previously converted PowerPoint files with download links.

#### History Display: Maps over the history array and displays the converted files with download links.
```
<Box sx={{ padding: 4, marginTop: 6, borderRadius: 2 , flex: 1, textAlign: 'center' }}>
  <Typography variant="h5" color={pink[300]} gutterBottom>
    Conversion History
  </Typography>
  <Box>
    {history.length === 0 ? (
      <Typography variant="body1" color={grey[300]}>No conversion history found.</Typography>
    ) : (
      history.map((item, index) => (
        <Box key={index} sx={{ marginBottom: 2 }}>
          <Button variant="outlined" color="primary" href={item.url} download={item.name} sx={{ /* styling */ }}>
            <FileDownloadIcon sx={{ marginRight: 1 }} />
            {item.name}
          </Button>
        </Box>
      ))
    )}
  </Box>
</Box>
```
    



# ---- Python Documentation ----

## Core Functionality
### PDF to PowerPoint Conversion (pdf_to_ppt)

This function handles the conversion of each page of the provided PDF into a PowerPoint slide.
Parameters:

    pdf_path: The file path of the PDF to convert.
    pptx_path: The target PowerPoint file path to save the converted slides.

Process:

    The function opens the PDF file using PyMuPDF (fitz).
    It iterates through each page of the PDF, rendering it to a high-resolution image using get_pixmap().
    The image for each page is saved temporarily as a PNG file.
    Each image is added as a slide in the PowerPoint presentation using the python-pptx library.
    The image is removed from the filesystem after being added to the slide.
    The PowerPoint file is saved to the specified path.

Return:

The function returns the path to the saved PowerPoint file.
### File Cleanup (cleanup_files)

This function ensures that temporary files are removed after processing to prevent excessive disk usage.

It cleans up:

    The uploaded PDF file.
    The generated PowerPoint file.

It is registered to run when the application shuts down using atexit.
### Flask Route (/convert)

#### This route handles file uploads and processes the conversion from PDF to PowerPoint.
Method: POST
Request:

    The user sends a POST request with a file upload (a PDF file).

    The file should be sent as form data with the key file.

Workflow:

    The server checks if a file is included in the request and ensures it is a valid PDF file.
    The file is saved to the server’s temporary directory.
    The pdf_to_ppt() function is called to convert the PDF into a PowerPoint presentation.
    The server sends back the converted PowerPoint file (.pptx) for download.

Response:

    If the conversion is successful, the server returns the generated PowerPoint file as an attachment.
    If any error occurs during the file processing, a relevant error message is returned with a 500 Internal Server Error status.

### CORS (Cross-Origin Resource Sharing)

    CORS is enabled for the /convert route to allow requests from any origin. This is particularly useful for web applications hosted on different domains, enabling them to interact with the Flask service.

# Code Walkthrough
## Imports
```
import os
import uuid
from flask import Flask, request, send_file
from flask_cors import CORS
import fitz  # PyMuPDF
from pptx import Presentation
from pptx.util import Inches
from PIL import Image
import io
import tempfile
import atexit
```

    os: Used for file and directory management.
    uuid: For generating unique identifiers to avoid file name conflicts.
    flask: The main web framework used for handling HTTP requests and responses.
    flask_cors: For handling cross-origin requests.
    fitz (PyMuPDF): A library for opening and manipulating PDF files.
    python-pptx: A library for generating PowerPoint files.
    PIL (Pillow): Used to process images.
    tempfile: Used for creating a temporary directory to store files.
    atexit: Registers a cleanup function that runs when the app shuts down.

## Initialize Flask Application

    app = Flask(__name__)

## Enable CORS for all domains 
Initializes the Flask app.
 
Configures CORS to allow any origin to send POST requests to the /convert route.

    CORS(app, resources={r"/convert": {"origins": "*", "methods": ["POST"], "allow_headers": ["Content-Type"]}})





## Temporary Directory for File Storage
Creates a temporary directory to store uploaded PDF files and the generated PowerPoint files. This ensures the files do not clutter the main directory and are cleaned up automatically.

    TEMP_DIR = tempfile.mkdtemp()



## Convert PDF to PowerPoint
The pdf_to_ppt function begins by creating a new PowerPoint presentation.
It opens the provided PDF using PyMuPDF and converts each page into a PNG image.
Each image is inserted as a slide in the PowerPoint file.
The image file is removed after being processed to keep the temporary directory clean.
After all pages have been processed, the PowerPoint file is saved and its path is returned.

    def pdf_to_ppt(pdf_path, pptx_path):
        prs = Presentation()
        try:
            doc = fitz.open(pdf_path)
        except Exception as e:
            print(f"Error opening PDF file: {e}")
            return None
        ...

  

## Cleanup Temporary Files

    def cleanup_files():
      if os.path.exists(pdf_path):
        os.remove(pdf_path)
    if pptx_file_path and os.path.exists(pptx_file_path):
        os.remove(pptx_file_path)

  This function is responsible for cleaning up any temporary files once the process is complete.
  The function is registered to run when the application shuts down using atexit.

## Handle the /convert Route
This route handles the file upload.
  The uploaded file is saved to a temporary location.
  It checks if the file is a PDF and proceeds to convert it to PowerPoint using the pdf_to_ppt() function.
  If the conversion is successful, the PowerPoint file is sent back to the user as a download.
  in case of any errors, an appropriate message is returned with an error code.

    @app.route('/convert', methods=['POST'])
    def convert_pdf_to_ppt():
    if 'file' not in request.files:
        return "No file part", 400

    file = request.files['file']
    if file.filename == '':
        return "No selected file", 400
    ...

  

## Running the Flask App
This line starts the Flask development server when the script is executed directly.

    if __name__ == '__main__':
    app.run(debug=True)

  