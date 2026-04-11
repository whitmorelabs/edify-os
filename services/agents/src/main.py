"""FastAPI application entry point for the Edify Agents service."""

from __future__ import annotations

import logging
from contextlib import asynccontextmanager
from typing import AsyncIterator

import asyncpg
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from src.api.router import router as execute_router
from src.decision_lab.router import router as decision_lab_router
from src.config import settings

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)-8s | %(name)s | %(message)s",
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncIterator[None]:
    """Manage startup / shutdown resources."""

    # -- Startup --
    logger.info("Edify Agents starting up on %s:%s", settings.HOST, settings.PORT)

    # Create a connection pool if a DATABASE_URL is configured.
    # In local dev it may be empty -- the service still works but
    # memory retrieval is skipped.
    db_pool: asyncpg.Pool | None = None
    if settings.DATABASE_URL:
        try:
            db_pool = await asyncpg.create_pool(
                dsn=settings.DATABASE_URL,
                min_size=2,
                max_size=10,
            )
            logger.info("Database pool created (%s)", settings.DATABASE_URL[:40] + "...")
        except Exception:
            logger.warning("Could not connect to database -- running without memory.", exc_info=True)

    app.state.db_pool = db_pool

    yield

    # -- Shutdown --
    if db_pool is not None:
        await db_pool.close()
        logger.info("Database pool closed.")

    logger.info("Edify Agents shut down.")


def create_app() -> FastAPI:
    """Build and return the FastAPI application instance."""

    app = FastAPI(
        title="Edify OS Agent Orchestration",
        description="AI brain of the Edify OS platform. Receives execution requests from the TypeScript API and orchestrates Claude-powered agents.",
        version="0.1.0",
        lifespan=lifespan,
    )

    # CORS -- allow the TS API server and local dev frontends
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],  # tighten in production
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # Mount routers
    app.include_router(execute_router, prefix="/api/v1", tags=["execution"])
    app.include_router(decision_lab_router, prefix="/api/v1", tags=["decision-lab"])

    @app.get("/health")
    async def health() -> dict[str, str]:
        return {"status": "ok", "service": "edify-agents"}

    return app


app = create_app()


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "src.main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=True,
    )
