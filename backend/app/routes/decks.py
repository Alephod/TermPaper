from flask import Blueprint, jsonify, request

from app.models import db, Deck, Word, deck_words, VALID_DIFFICULTIES

decks_bp = Blueprint('decks', __name__)


@decks_bp.route('', methods=['GET'])
def list_decks():
    decks = Deck.query.order_by(Deck.created_at).all()
    return jsonify([d.to_dict() for d in decks])


@decks_bp.route('/<string:deck_id>', methods=['GET'])
def get_deck(deck_id):
    deck = db.session.get(Deck, deck_id)
    if not deck:
        return jsonify({'error': 'Deck not found'}), 404
    return jsonify(deck.to_dict(include_words=True))


@decks_bp.route('', methods=['POST'])
def create_deck():
    data = request.get_json(silent=True)
    if not data:
        return jsonify({'error': 'Request body must be JSON'}), 400

    name = (data.get('name') or '').strip()
    if not name:
        return jsonify({'error': 'name is required'}), 400

    deck = Deck(name=name)

    if data.get('id'):
        deck.id = data['id']

    db.session.add(deck)
    db.session.commit()

    return jsonify(deck.to_dict()), 201


@decks_bp.route('/<string:deck_id>', methods=['PATCH'])
def rename_deck(deck_id):
    deck = db.session.get(Deck, deck_id)
    if not deck:
        return jsonify({'error': 'Deck not found'}), 404

    data = request.get_json(silent=True)
    if not data:
        return jsonify({'error': 'Request body must be JSON'}), 400

    name = (data.get('name') or '').strip()
    if not name:
        return jsonify({'error': 'name is required'}), 400

    deck.name = name
    db.session.commit()

    return jsonify(deck.to_dict())


@decks_bp.route('/<string:deck_id>', methods=['DELETE'])
def delete_deck(deck_id):
    deck = db.session.get(Deck, deck_id)
    if not deck:
        return jsonify({'error': 'Deck not found'}), 404

    db.session.delete(deck)
    db.session.commit()

    return jsonify({'message': 'Deck deleted'})


@decks_bp.route('/<string:deck_id>/words', methods=['POST'])
def add_word_to_deck(deck_id):
    deck = db.session.get(Deck, deck_id)
    if not deck:
        return jsonify({'error': 'Deck not found'}), 404

    data = request.get_json(silent=True)
    if not data:
        return jsonify({'error': 'Request body must be JSON'}), 400

    word_id = data.get('wordId')
    if not word_id:
        return jsonify({'error': 'wordId is required'}), 400

    word = db.session.get(Word, word_id)
    if not word:
        return jsonify({'error': 'Word not found'}), 404

    if word in deck.words:
        return jsonify({'error': 'Word already in deck'}), 409

    deck.words.append(word)
    db.session.commit()

    return jsonify(deck.to_dict())


@decks_bp.route('/<string:deck_id>/words/new', methods=['POST'])
def create_word_in_deck(deck_id):
    deck = db.session.get(Deck, deck_id)
    if not deck:
        return jsonify({'error': 'Deck not found'}), 404

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
    deck.words.append(word)
    db.session.commit()

    return jsonify({
        'word': word.to_dict(),
        'deck': deck.to_dict(),
    }), 201


@decks_bp.route('/<string:deck_id>/words/<string:word_id>', methods=['PUT'])
def edit_word_in_deck(deck_id, word_id):
    deck = db.session.get(Deck, deck_id)
    if not deck:
        return jsonify({'error': 'Deck not found'}), 404

    word = db.session.get(Word, word_id)
    if not word:
        return jsonify({'error': 'Word not found'}), 404

    if word not in deck.words:
        return jsonify({'error': 'Word is not in this deck'}), 404

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


@decks_bp.route('/<string:deck_id>/words/<string:word_id>', methods=['DELETE'])
def remove_word_from_deck(deck_id, word_id):
    deck = db.session.get(Deck, deck_id)
    if not deck:
        return jsonify({'error': 'Deck not found'}), 404

    word = db.session.get(Word, word_id)
    if not word:
        return jsonify({'error': 'Word not found'}), 404

    if word not in deck.words:
        return jsonify({'error': 'Word is not in this deck'}), 404

    deck.words.remove(word)
    db.session.commit()

    return jsonify({'message': 'Word removed from deck'})
