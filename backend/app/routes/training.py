from datetime import datetime, timezone

from flask import Blueprint, jsonify, request

from app.models import db, TrainingSession

training_bp = Blueprint('training', __name__)


@training_bp.route('', methods=['GET'])
def list_sessions():
    sessions = TrainingSession.query.order_by(
        TrainingSession.date.desc()).all()
    return jsonify([s.to_dict() for s in sessions])


@training_bp.route('', methods=['POST'])
def create_session():
    data = request.get_json(silent=True)
    if not data:
        return jsonify({'error': 'Request body must be JSON'}), 400

    total_questions = data.get('totalQuestions')
    correct_answers = data.get('correctAnswers')
    accuracy = data.get('accuracy')

    if total_questions is None or correct_answers is None or accuracy is None:
        return jsonify({'error': 'totalQuestions, correctAnswers, and accuracy are required'}), 400

    if not isinstance(total_questions, int) or total_questions < 0:
        return jsonify({'error': 'totalQuestions must be a non-negative integer'}), 400

    if not isinstance(correct_answers, int) or correct_answers < 0:
        return jsonify({'error': 'correctAnswers must be a non-negative integer'}), 400

    if not isinstance(accuracy, int) or accuracy < 0 or accuracy > 100:
        return jsonify({'error': 'accuracy must be an integer between 0 and 100'}), 400

    date_str = data.get('date')
    if date_str:
        try:
            date = datetime.fromisoformat(date_str.replace('Z', '+00:00'))
        except (ValueError, AttributeError):
            return jsonify({'error': 'date must be a valid ISO 8601 string'}), 400
    else:
        date = datetime.now(timezone.utc)

    correct_word_ids = data.get('correctWordIds', [])
    wrong_word_ids = data.get('wrongWordIds', [])

    if not isinstance(correct_word_ids, list) or not isinstance(wrong_word_ids, list):
        return jsonify({'error': 'correctWordIds and wrongWordIds must be arrays'}), 400

    session = TrainingSession(
        date=date,
        total_questions=total_questions,
        correct_answers=correct_answers,
        accuracy=accuracy,
        correct_word_ids=correct_word_ids,
        wrong_word_ids=wrong_word_ids,
    )

    if data.get('id'):
        session.id = data['id']

    db.session.add(session)
    db.session.commit()

    return jsonify(session.to_dict()), 201
