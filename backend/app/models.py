from datetime import datetime, timezone
from uuid import uuid4

from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()

VALID_DIFFICULTIES = ('easy', 'medium', 'hard')


def _utcnow():
    return datetime.now(timezone.utc)


def _generate_id():
    return uuid4().hex


deck_words = db.Table(
    'deck_words',
    db.Column(
        'deck_id',
        db.String(64),
        db.ForeignKey('deck.id', ondelete='CASCADE'),
        primary_key=True,
    ),
    db.Column(
        'word_id',
        db.String(64),
        db.ForeignKey('word.id', ondelete='CASCADE'),
        primary_key=True,
    ),
)


class Word(db.Model):
    __tablename__ = 'word'

    id = db.Column(db.String(64), primary_key=True, default=_generate_id)
    term = db.Column(db.String(255), nullable=False)
    translation = db.Column(db.String(255), nullable=False)
    difficulty = db.Column(db.String(10), nullable=False, default='easy')
    example = db.Column(db.String(500), nullable=False, default='')
    example_translation = db.Column(db.String(500), nullable=False, default='')
    created_at = db.Column(db.DateTime, nullable=False, default=_utcnow)
    updated_at = db.Column(db.DateTime, nullable=False,
                           default=_utcnow, onupdate=_utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'term': self.term,
            'translation': self.translation,
            'difficulty': self.difficulty,
            'example': self.example,
            'exampleTranslation': self.example_translation,
            'createdAt': self.created_at.isoformat() if self.created_at else None,
            'updatedAt': self.updated_at.isoformat() if self.updated_at else None,
        }


class Deck(db.Model):
    __tablename__ = 'deck'

    id = db.Column(db.String(64), primary_key=True, default=_generate_id)
    name = db.Column(db.String(255), nullable=False)
    created_at = db.Column(db.DateTime, nullable=False, default=_utcnow)
    updated_at = db.Column(db.DateTime, nullable=False,
                           default=_utcnow, onupdate=_utcnow)

    words = db.relationship(
        'Word',
        secondary=deck_words,
        backref=db.backref('decks', lazy='select'),
        lazy='select',
    )

    def to_dict(self, include_words=False):
        result = {
            'id': self.id,
            'name': self.name,
            'wordIds': [w.id for w in self.words],
            'createdAt': self.created_at.isoformat() if self.created_at else None,
            'updatedAt': self.updated_at.isoformat() if self.updated_at else None,
        }
        if include_words:
            result['words'] = [w.to_dict() for w in self.words]
        return result


class TrainingSession(db.Model):
    __tablename__ = 'training_session'

    id = db.Column(db.String(64), primary_key=True, default=_generate_id)
    date = db.Column(db.DateTime, nullable=False)
    total_questions = db.Column(db.Integer, nullable=False)
    correct_answers = db.Column(db.Integer, nullable=False)
    accuracy = db.Column(db.Integer, nullable=False)
    correct_word_ids = db.Column(db.JSON, nullable=False, default=list)
    wrong_word_ids = db.Column(db.JSON, nullable=False, default=list)

    def to_dict(self):
        return {
            'id': self.id,
            'date': self.date.isoformat() if self.date else None,
            'totalQuestions': self.total_questions,
            'correctAnswers': self.correct_answers,
            'accuracy': self.accuracy,
            'correctWordIds': self.correct_word_ids or [],
            'wrongWordIds': self.wrong_word_ids or [],
        }
