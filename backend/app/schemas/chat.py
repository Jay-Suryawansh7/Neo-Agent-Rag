"""
Pydantic schemas for chat API request/response models.
Matches the frontend BlockRenderer expectations exactly.
"""

from pydantic import BaseModel
from typing import Literal, Optional


class ChatRequest(BaseModel):
    """Incoming chat request from frontend."""
    message: str
    conversation_id: str


class Block(BaseModel):
    """
    A content block matching the frontend BlockRenderer types.
    
    Allowed types:
    - heading: Section header (content required)
    - paragraph: Text content (content required)
    - list: Bullet list (items required)
    - numbered_list: Numbered list (items required)
    - quote: Blockquote (content required)
    - code: Code block (content required, language optional)
    - divider: Horizontal rule (no content needed)
    """
    type: Literal["heading", "paragraph", "list", "numbered_list", "quote", "code", "divider"]
    content: Optional[str] = None
    items: Optional[list[str]] = None  # For list/numbered_list blocks
    language: Optional[str] = None     # For code blocks


class Source(BaseModel):
    """Source metadata from Pinecone retrieval."""
    title: Optional[str] = None
    source: Optional[str] = None
    score: Optional[float] = None


class ChatResponse(BaseModel):
    """
    Structured response matching frontend expectations.
    
    - blocks: Array of content blocks
    - sources: Array of source metadata (empty for general mode)
    - mode: "general" or "rag"
    """
    blocks: list[Block]
    sources: list[Source] = []
    mode: Literal["general", "rag"]
    request_id: Optional[str] = None
