from datetime import datetime, timedelta, timezone
from typing import Tuple


def calculate_sm2(
    easiness_factor: float,
    repetitions: int,
    interval: int,
    quality: int
) -> Tuple[float, int, int, int]:
    """Параметры SM-2 после повторения.
        easiness_factor: Текущий EF (обычно от 1.3 до 2.5)
        repetitions: Количество успешных повторений
        interval: Предыдущий интервал в днях
        quality: Качество ответа (0-5)
            0 - полный провал
            1 - неправильно, но правильный ответ
            2 - неправильно, легко вспомнил правильный
            3 - правильно, но с трудом
            4 - правильно, но с колебанием
            5 - идеальный ответ
    """
    if not (0 <= quality <= 5):
        raise ValueError("Quality must be between 0 and 5")
    
    # Минимальный EF = 1.3
    min_ef = 1.3
    
    # Расчет нового фактора лёгкости
    new_ef = easiness_factor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02))
    new_ef = max(min_ef, new_ef)
    
    if quality < 3:
        return (new_ef, 1, 0, quality)
    
    new_repetitions = repetitions + 1
    
    # Расчет нового интервала
    if new_repetitions == 1:
        new_interval = 1
    elif new_repetitions == 2:
        new_interval = 6
    else:
        new_interval = round(interval * easiness_factor)
    
    return (new_ef, new_interval, new_repetitions, quality)


def get_default_sm2_values() -> Tuple[float, int, int]:
    return (2.5, 0, 0)

# Расчет даты следующего повторения
def calculate_next_review_date(interval: int) -> datetime:
    return datetime.now(timezone.utc) + timedelta(days=interval)


def should_review(
    next_review: datetime | None,
    now: datetime | None = None
) -> bool:
    if next_review is None:
        return True
    
    if now is None:
        now = datetime.now(timezone.utc)
    
    return next_review <= now

# Нормализация значений SM-2
def normalize_sm2_values(
    easiness_factor: float | None,
    interval: int | None,
    repetitions: int | None
) -> Tuple[float, int, int]:
    defaults = get_default_sm2_values()
    return (
        easiness_factor if easiness_factor is not None else defaults[0],
        interval if interval is not None else defaults[1],
        repetitions if repetitions is not None else defaults[2],
    )
