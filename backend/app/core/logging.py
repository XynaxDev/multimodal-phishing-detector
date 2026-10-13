import logging


def setup_logging(level: str = "INFO") -> None:
    logging.basicConfig(
        level=getattr(logging, level.upper(), logging.INFO),
        format="%(asctime)s | %(levelname)-7s | %(name)s | %(message)s",
    )
    # Silence noisy third-party loggers.
    for name in ("urllib3", "httpx", "PIL"):
        logging.getLogger(name).setLevel(logging.WARNING)
