
# 3D Model Upload and Export API

This is a Flask-based backend for uploading, retrieving, and converting 3D models in STL and OBJ formats. The API allows users to upload 3D files, retrieve them, and export them to a different format.

## Features
- Upload 3D models in STL or OBJ format.
- Retrieve uploaded 3D models.
- Convert models between STL and OBJ formats.
- Secure file handling with unique filenames.
- Cross-Origin Resource Sharing (CORS) enabled for frontend integration.

## Technologies Used
- Flask (Python web framework)
- Flask-CORS (Handling cross-origin requests)
- Trimesh (3D model processing)
- NumPy (Used internally by Trimesh)
- WerkZeug (Secure file handling)
- UUID (Generating unique filenames)

## Installation

### Prerequisites
Ensure you have Python installed on your system.

### Steps
1. Clone the repository:
   ```sh
   git clone <repository-url>
   cd <repository-folder>
   ```
2. Create a virtual environment (optional but recommended):
   ```sh
   python -m venv venv
   source venv/bin/activate  # On Windows use: venv\Scripts\activate
   ```
3. Install dependencies:
   ```sh
   pip install -r requirements.txt
   ```
4. Run the Flask server:
   ```sh
   python app.py
   ```
5. The API will be available at:
   ```
   http://127.0.0.1:5000/
   ```

## API Endpoints

### 1. Upload a 3D Model
**Endpoint:** `/api/upload`  
**Method:** `POST`  
**Description:** Upload a STL or OBJ file.

#### Request:
- **Form Data:** `file` (STL or OBJ file)

#### Response:
```json
{
  "message": "File uploaded successfully",
  "filename": "unique-filename.stl"
}
```

---

### 2. Retrieve a 3D Model
**Endpoint:** `/api/models/<filename>`  
**Method:** `GET`  
**Description:** Retrieve an uploaded 3D model by filename.

#### Response:
- Returns the requested file.

---

### 3. Export a 3D Model
**Endpoint:** `/api/export`  
**Method:** `POST`  
**Description:** Convert a 3D model between STL and OBJ formats.

#### Request:
- **Form Data:**
  - `file` (Uploaded 3D model)
  - `fromFormat` (Current format: `stl` or `obj`)
  - `toFormat` (Desired format: `stl` or `obj`)

#### Response:
- Returns the converted file for download.

---

## Notes
- The maximum file size allowed is **16MB**.
- Temporary files are stored in the system's temp directory and deleted after processing.

## Future Improvements
- Support for additional 3D file formats (e.g., GLTF, FBX, PLY).
- Cloud storage support (AWS S3, Google Cloud Storage).
- File validation and preview support.



