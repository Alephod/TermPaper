import click

from app.models import db, Word


INITIAL_WORDS = [
    {
        'id': 'd1',
        'term': 'apple',
        'translation': '\u044f\u0431\u043b\u043e\u043a\u043e',
        'difficulty': 'easy',
        'example': 'I eat an apple every morning',
        'example_translation': '\u042f \u0435\u043c \u044f\u0431\u043b\u043e\u043a\u043e \u043a\u0430\u0436\u0434\u043e\u0435 \u0443\u0442\u0440\u043e',
    },
    {
        'id': 'd2',
        'term': 'house',
        'translation': '\u0434\u043e\u043c',
        'difficulty': 'easy',
        'example': 'This house is very old',
        'example_translation': '\u042d\u0442\u043e\u0442 \u0434\u043e\u043c \u043e\u0447\u0435\u043d\u044c \u0441\u0442\u0430\u0440\u044b\u0439',
    },
    {
        'id': 'd3',
        'term': 'water',
        'translation': '\u0432\u043e\u0434\u0430',
        'difficulty': 'medium',
        'example': 'Drink more water during the day',
        'example_translation': '\u041f\u0435\u0439 \u0431\u043e\u043b\u044c\u0448\u0435 \u0432\u043e\u0434\u044b \u0432 \u0442\u0435\u0447\u0435\u043d\u0438\u0435 \u0434\u043d\u044f',
    },
    {
        'id': 'd4',
        'term': 'interesting',
        'translation': '\u0438\u043d\u0442\u0435\u0440\u0435\u0441\u043d\u044b\u0439',
        'difficulty': 'medium',
        'example': 'This book is very interesting',
        'example_translation': '\u042d\u0442\u0430 \u043a\u043d\u0438\u0433\u0430 \u043e\u0447\u0435\u043d\u044c \u0438\u043d\u0442\u0435\u0440\u0435\u0441\u043d\u0430\u044f',
    },
    {
        'id': 'd5',
        'term': 'airport',
        'translation': '\u0430\u044d\u0440\u043e\u043f\u043e\u0440\u0442',
        'difficulty': 'hard',
        'example': 'We arrived at the airport early',
        'example_translation': '\u041c\u044b \u043f\u0440\u0438\u0431\u044b\u043b\u0438 \u0432 \u0430\u044d\u0440\u043e\u043f\u043e\u0440\u0442 \u0440\u0430\u043d\u043e',
    },
]


def seed_database():
    existing = Word.query.first()
    if existing:
        click.echo('Database already has data, skipping seed.')
        return

    for entry in INITIAL_WORDS:
        word = Word(
            id=entry['id'],
            term=entry['term'],
            translation=entry['translation'],
            difficulty=entry['difficulty'],
            example=entry['example'],
            example_translation=entry['example_translation'],
        )
        db.session.add(word)

    db.session.commit()
    click.echo(f'Seeded {len(INITIAL_WORDS)} words.')


def register_seed_command(app):
    @app.cli.command('seed')
    def seed():
        """Seed the database with initial dictionary data."""
        seed_database()
