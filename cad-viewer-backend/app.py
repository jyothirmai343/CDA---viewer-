
from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
import os
import tempfile
import numpy as np
from werkzeug.utils import secure_filename
import trimesh
import uuid

app = Flask(__name__)
CORS(app) 


UPLOAD_FOLDER = os.path.join(tempfile.gettempdir(), 'cad_viewer_uploads')
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024 

ALLOWED_EXTENSIONS = {'stl', 'obj'}

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@app.route('/api/upload', methods=['POST'])
def upload_file():
    if 'file' not in request.files:
        return jsonify({'error': 'No file part'}), 400
    
    file = request.files['file']
    
    if file.filename == '':
        return jsonify({'error': 'No selected file'}), 400
    
    if not allowed_file(file.filename):
        return jsonify({'error': 'File type not allowed'}), 400
    
    try:
        
        original_filename = secure_filename(file.filename)
        file_extension = original_filename.rsplit('.', 1)[1].lower()
        unique_filename = f"{uuid.uuid4().hex}.{file_extension}"
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], unique_filename)
        
     
        file.save(filepath)
        

        return jsonify({
            'message': 'File uploaded successfully',
            'filename': unique_filename
        }), 200
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/models/<filename>', methods=['GET'])
def get_model(filename):
    filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
    
    if not os.path.exists(filepath):
        return jsonify({'error': 'File not found'}), 404
    
    return send_file(filepath)

@app.route('/api/export', methods=['POST'])
def export_model():
    if 'file' not in request.files:
        return jsonify({'error': 'No file part'}), 400
    
    file = request.files['file']
    from_format = request.form.get('fromFormat', '')
    to_format = request.form.get('toFormat', '')
    
    if file.filename == '' or not from_format or not to_format:
        return jsonify({'error': 'Missing file or format information'}), 400
    
    if from_format not in ALLOWED_EXTENSIONS or to_format not in ALLOWED_EXTENSIONS:
        return jsonify({'error': 'Unsupported file format'}), 400
    
    try:
        original_filename = secure_filename(file.filename)
        temp_input_path = os.path.join(app.config['UPLOAD_FOLDER'], f"temp_input_{uuid.uuid4().hex}.{from_format}")
        file.save(temp_input_path)
        
        
        output_filename = f"export_{uuid.uuid4().hex}.{to_format}"
        temp_output_path = os.path.join(app.config['UPLOAD_FOLDER'], output_filename)
        
        
        mesh = trimesh.load(temp_input_path)
        
      
        if to_format == 'stl':
            mesh.export(temp_output_path, file_type='stl')
        elif to_format == 'obj':
            mesh.export(temp_output_path, file_type='obj')
        
        
        return send_file(
            temp_output_path,
            as_attachment=True,
            download_name=f"model.{to_format}",
            mimetype=f'application/octet-stream'
        )
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    
    finally:
       
        try:
            if os.path.exists(temp_input_path):
                os.remove(temp_input_path)
        except:
            pass

if __name__ == '__main__':
    app.run(debug=True)
