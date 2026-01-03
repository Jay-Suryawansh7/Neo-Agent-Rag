"""
Utility functions for formatting LLM responses into block structure.
"""

import json
import re
from app.schemas.chat import Block, ChatResponse, Source


def parse_llm_json_response(llm_output: str) -> list[Block]:
    """
    Parse LLM JSON output into Block objects.
    Handles common LLM formatting issues (markdown code blocks, etc.)
    """
    # Clean up common LLM artifacts
    cleaned = llm_output.strip()
    
    # Remove markdown code block wrapper if present
    if cleaned.startswith("```json"):
        cleaned = cleaned[7:]
    elif cleaned.startswith("```"):
        cleaned = cleaned[3:]
    if cleaned.endswith("```"):
        cleaned = cleaned[:-3]
    
    cleaned = cleaned.strip()
    
    try:
        data = json.loads(cleaned)
        
        # Guard against non-dict JSON (e.g., list or string)
        if not isinstance(data, dict):
             # Fallback: wrap raw text as paragraph
            return [Block(type="paragraph", content=llm_output)]

        blocks_data = data.get("blocks", [])
        
        if not blocks_data:
             # Fallback if blocks key is missing or empty
            return [Block(type="paragraph", content=llm_output)]

        blocks = []
        for b in blocks_data:
            blocks.append(Block(
                type=b.get("type", "paragraph"),
                content=b.get("content"),
                items=b.get("items"),
                language=b.get("language")
            ))
        
        return blocks
    except (json.JSONDecodeError, AttributeError, TypeError):
        # Fallback: wrap raw text as paragraph
        return [Block(type="paragraph", content=llm_output)]


def create_fallback_response() -> ChatResponse:
    """
    Create a safe fallback response when RAG context is insufficient.
    """
    return ChatResponse(
        blocks=[
            Block(
                type="paragraph",
                content="I don't have that information in Cogneoverse knowledge. Try asking about general topics, or rephrase your question about our internal projects."
            )
        ],
        sources=[],
        mode="rag"
    )


def create_error_response(error_message: str) -> ChatResponse:
    """
    Create an error response block.
    """
    return ChatResponse(
        blocks=[
            Block(
                type="paragraph",
                content=f"I encountered an issue processing your request. Please try again. ({error_message})"
            )
        ],
        sources=[],
        mode="general"
    )


def format_sources(raw_sources: list[dict]) -> list[Source]:
    """
    Convert raw source dicts to Source objects.
    """
    return [
        Source(
            title=s.get("title"),
            source=s.get("source"),
            score=s.get("score")
        )
        for s in raw_sources
    ]
