import type { Block } from '@/types/chat';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export function BlockRenderer({ block }: { block: Block }) {
  switch (block.type) {

    case 'list':
      return (
        <ul className="list-disc list-outside ml-4 mb-4 space-y-2 text-zinc-300">
          {block.items?.map((item, i) => (
            <li key={i} className="pl-1">{item}</li>
          ))}
        </ul>
      );
    case 'numbered_list':
      return (
        <ol className="list-decimal list-outside ml-4 mb-4 space-y-2 text-zinc-300">
          {block.items?.map((item, i) => (
            <li key={i} className="pl-1">{item}</li>
          ))}
        </ol>
      );
    case 'quote':
      return (
        <blockquote className="border-l-2 border-emerald-500/50 pl-4 italic text-zinc-400 my-4 text-lg">
          "{block.content}"
        </blockquote>
      );
    case 'paragraph':
      return (
        <div className="text-zinc-300 leading-7 mb-4 font-light prose prose-invert max-w-none prose-p:leading-7 prose-p:mb-4">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              p: ({ children }: { children?: React.ReactNode }) => <p className="mb-0">{children}</p>
            }}
          >
            {block.content}
          </ReactMarkdown>
        </div>
      );
    case 'heading':
      return (
        <h3 className="text-xl font-medium text-white/90 mt-8 mb-4 tracking-tight">
          {block.content}
        </h3>
      );
    case 'code':
      return (
        <div className="bg-black/40 border border-white/10 rounded-lg p-4 my-4 overflow-x-auto font-mono text-sm text-emerald-400">
          <pre>{block.content}</pre>
        </div>
      );
    case 'divider':
      return <hr className="border-white/10 my-8" />;
    default:
      return null;
  }
}
