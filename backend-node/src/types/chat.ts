export interface Block {
    type: string;
    content?: string;
    items?: string[]; // for lists
    language?: string; // for code blocks
}

export interface Source {
    title: string;
    source: string;
    score: number;
}

export interface ChatRequest {
    message: string;
}

export interface ChatResponse {
    blocks: Block[];
    sources?: Source[];
    mode: 'general' | 'rag' | 'rag_strong' | 'rag_weak';
    request_id: string;
}
