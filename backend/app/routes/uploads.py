import os
import uuid
from flask import Blueprint, jsonify, request, send_from_directory, current_app

uploads_bp = Blueprint('uploads', __name__)


def ensure_upload_folder():
    # Создание папки, если она не существует
    os.makedirs(current_app.config['UPLOAD_FOLDER'], exist_ok=True)


@uploads_bp.route('/image', methods=['POST'])
def upload_image():
    # Загрузка изображения
    ensure_upload_folder()

    if 'file' not in request.files:
        return jsonify({'error': 'No file part'}), 400

    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': 'No selected file'}), 400

    if file:
        # Генерация уникального имени файла
        ext = file.filename.rsplit('.', 1)[1].lower()
        filename = f"{uuid.uuid4().hex}.{ext}"

        filepath = os.path.join(current_app.config['UPLOAD_FOLDER'], filename)
        file.save(filepath)

        return jsonify({
            'filename': filename,
            'path': f"/uploads/{filename}"
        }), 201

# Обработчик для возврата файлов из папки uploads
@uploads_bp.route('/<path:filename>')
def serve_file(filename):
    return send_from_directory(
        current_app.config['UPLOAD_FOLDER'],
        filename
    )