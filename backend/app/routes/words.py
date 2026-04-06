from flask import Blueprint, jsonify, request

from app.models import db, Word, VALID_DIFFICULTIES

words_bp = Blueprint('words', __name__)


@words_bp.route('', methods=['GET'])
def list_words():
    difficulty = request.args.get('difficulty')

    query = Word.query
    if difficulty and difficulty in VALID_DIFFICULTIES:
        query = query.filter_by(difficulty=difficulty)

    words = query.order_by(Word.created_at).all()
    return jsonify([w.to_dict() for w in words])


@words_bp.route('/<string:word_id>', methods=['GET'])
def get_word(word_id):
    word = db.session.get(Word, word_id)
    if not word:
        return jsonify({'error': 'Word not found'}), 404
    return jsonify(word.to_dict())


@words_bp.route('', methods=['POST'])
def create_word():
    data = request.get_json(silent=True)
    if not data:
        return jsonify({'error': 'Request body must be JSON'}), 400

    term = (data.get('term') or '').strip()
    translation = (data.get('translation') or '').strip()

    if not term or not translation:
        return jsonify({'error': 'term and translation are required'}), 400

    difficulty = data.get('difficulty', 'easy')
    if difficulty not in VALID_DIFFICULTIES:
        return jsonify({'error': f'difficulty must be one of: {", ".join(VALID_DIFFICULTIES)}'}), 400

    word = Word(
        term=term,
        translation=translation,
        difficulty=difficulty,
        example=(data.get('example') or '').strip(),
        example_translation=(data.get('exampleTranslation') or '').strip(),
    )

    if data.get('id'):
        word.id = data['id']

    db.session.add(word)
    db.session.commit()

    return jsonify(word.to_dict()), 201


@words_bp.route('/<string:word_id>', methods=['PUT'])
def update_word(word_id):
    word = db.session.get(Word, word_id)
    if not word:
        return jsonify({'error': 'Word not found'}), 404

    data = request.get_json(silent=True)
    if not data:
        return jsonify({'error': 'Request body must be JSON'}), 400

    if 'term' in data:
        term = (data['term'] or '').strip()
        if not term:
            return jsonify({'error': 'term cannot be empty'}), 400
        word.term = term

    if 'translation' in data:
        translation = (data['translation'] or '').strip()
        if not translation:
            return jsonify({'error': 'translation cannot be empty'}), 400
        word.translation = translation

    if 'difficulty' in data:
        if data['difficulty'] not in VALID_DIFFICULTIES:
            return jsonify({'error': f'difficulty must be one of: {", ".join(VALID_DIFFICULTIES)}'}), 400
        word.difficulty = data['difficulty']

    if 'example' in data:
        word.example = (data['example'] or '').strip()

    if 'exampleTranslation' in data:
        word.example_translation = (data['exampleTranslation'] or '').strip()

    db.session.commit()

    return jsonify(word.to_dict())


@words_bp.route('/<string:word_id>', methods=['DELETE'])
def delete_word(word_id):
    word = db.session.get(Word, word_id)
    if not word:
        return jsonify({'error': 'Word not found'}), 404

    db.session.delete(word)
    db.session.commit()

    return jsonify({'message': 'Word deleted'})


@words_bp.route('', methods=['DELETE'])
def clear_words():
    Word.query.delete()
    db.session.commit()

    return jsonify({'message': 'All words cleared'})
