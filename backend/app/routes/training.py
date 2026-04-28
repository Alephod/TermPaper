from datetime import datetime, timezone

from flask import Blueprint, jsonify, request

from app.models import db, TrainingSession, Word
from app import sm2

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


@training_bp.route('/words-for-review', methods=['POST'])
def get_words_for_review():
    data = request.get_json(silent=True) or {}
    word_ids = data.get('wordIds', [])
    limit = data.get('limit', 40)
    
    if not isinstance(word_ids, list):
        return jsonify({'error': 'wordIds must be an array'}), 400
    
    if not isinstance(limit, int) or limit < 1:
        return jsonify({'error': 'limit must be a positive integer'}), 400
    
    now = datetime.now(timezone.utc)
    
    query = Word.query
    if word_ids:
        query = query.filter(Word.id.in_(word_ids))
    
    # Получение слов для повторения
    words = query.filter(
        (Word.sm2_next_review == None) | (Word.sm2_next_review <= now)
    ).order_by(
        Word.sm2_next_review.asc().nullsfirst()
    ).limit(limit).all()
    
    return jsonify([w.to_dict() for w in words])


@training_bp.route('/review', methods=['POST'])
def record_review():
    data = request.get_json(silent=True)
    if not data:
        return jsonify({'error': 'Request body must be JSON'}), 400
    
    word_id = data.get('wordId')
    quality = data.get('quality')
    
    if not word_id:
        return jsonify({'error': 'wordId is required'}), 400
    
    if quality is None:
        return jsonify({'error': 'quality is required'}), 400
    
    if not isinstance(quality, int) or not (0 <= quality <= 5):
        return jsonify({'error': 'quality must be an integer between 0 and 5'}), 400
    
    word = Word.query.get(word_id)
    if not word:
        return jsonify({'error': 'Word not found'}), 404
    
    # Получение текущих параметров SM-2
    ef, interval, repetitions = sm2.normalize_sm2_values(
        word.sm2_easiness_factor,
        word.sm2_interval,
        word.sm2_repetitions
    )
    
    # Расчет новых параметров SM-2
    new_ef, new_interval, new_repetitions, _ = sm2.calculate_sm2(
        ef, repetitions, interval, quality
    )
    
    # Обновление слов
    word.sm2_easiness_factor = new_ef
    word.sm2_interval = new_interval
    word.sm2_repetitions = new_repetitions
    word.sm2_last_review = datetime.now(timezone.utc)
    word.sm2_next_review = sm2.calculate_next_review_date(new_interval)
    
    db.session.commit()
    
    return jsonify({
        'word': word.to_dict(),
        'previous': {
            'easinessFactor': ef,
            'interval': interval,
            'repetitions': repetitions
        },
        'new': {
            'easinessFactor': new_ef,
            'interval': new_interval,
            'repetitions': new_repetitions
        },
        'quality': quality
    })