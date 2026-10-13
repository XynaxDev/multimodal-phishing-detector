"""Aggregates all v1 routers."""
from fastapi import APIRouter

from app.api.routes import analyze, chat, llm_verify, system

api_router = APIRouter()
api_router.include_router(system.router)
api_router.include_router(analyze.router)
api_router.include_router(chat.router)
api_router.include_router(llm_verify.router)
