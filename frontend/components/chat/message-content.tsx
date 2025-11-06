"use client";

import React, { useMemo } from "react";
import { CodeBlock } from "@/components/ui/code-block";

interface MessageContentProps {
  content: string;
  className?: string;
}

interface ParsedBlock {
  type: "text" | "code";
  content: string;
  language?: string;
  filename?: string;
}

function parseMessageContent(content: string): ParsedBlock[] {
  const blocks: ParsedBlock[] = [];
  
  // Regular expression to match code blocks with optional language and filename
  // Supports: ```language, ```language:filename, or just ```
  const codeBlockRegex = /```(\w+)?(?::([^\n]+))?\n([\s\S]*?)```/g;
  
  let lastIndex = 0;
  let match;

  while ((match = codeBlockRegex.exec(content)) !== null) {
    // Add text before code block
    if (match.index > lastIndex) {
      const textContent = content.substring(lastIndex, match.index).trim();
      if (textContent) {
        blocks.push({
          type: "text",
          content: textContent,
        });
      }
    }

    // Add code block
    const language = match[1] || "text";
    const filename = match[2] || "";
    const code = match[3];

    blocks.push({
      type: "code",
      content: code,
      language: language,
      filename: filename,
    });

    lastIndex = match.index + match[0].length;
  }

  // Add remaining text after last code block
  if (lastIndex < content.length) {
    const textContent = content.substring(lastIndex).trim();
    if (textContent) {
      blocks.push({
        type: "text",
        content: textContent,
      });
    }
  }

  // If no code blocks found, return original content as text
  if (blocks.length === 0) {
    blocks.push({
      type: "text",
      content: content,
    });
  }

  return blocks;
}

function formatTextContent(text: string): React.ReactNode {
  // Create a simple hash of the text for keys to ensure React updates on content changes
  const textHash = text.length > 0 ? text.substring(0, Math.min(50, text.length)).replace(/\s/g, '').substring(0, 20) : '';
  
  // Split by newlines to preserve line breaks
  const lines = text.split("\n");
  
  let inBulletList = false;
  let inNumberedList = false;
  let bulletItems: React.ReactNode[] = [];
  let numberedItems: React.ReactNode[] = [];
  let result: React.ReactNode[] = [];
  
  const flushBulletList = () => {
    if (bulletItems.length > 0) {
      result.push(
        <ul key={`bullet-list-${result.length}-${textHash}`} className="my-4 space-y-2.5 list-disc list-outside ml-6 pl-2">
          {bulletItems}
        </ul>
      );
      bulletItems = [];
      inBulletList = false;
    }
  };
  
  const flushNumberedList = () => {
    if (numberedItems.length > 0) {
      result.push(
        <ol key={`numbered-list-${result.length}-${textHash}`} className="my-4 space-y-2.5 list-decimal list-outside ml-6 pl-2">
          {numberedItems}
        </ol>
      );
      numberedItems = [];
      inNumberedList = false;
    }
  };
  
  const flushAllLists = () => {
    flushBulletList();
    flushNumberedList();
  };
  
  lines.forEach((line, index) => {
    // Format bold text **text**
    let formattedLine = line.replace(/\*\*([^*]+)\*\*/g, '<strong class="font-semibold text-gray-900">$1</strong>');
    
    // Format italic text *text*
    formattedLine = formattedLine.replace(/\*([^*]+)\*/g, '<em class="italic text-gray-700">$1</em>');
    
    // Format inline code `code`
    formattedLine = formattedLine.replace(/`([^`]+)`/g, '<code class="px-1.5 py-0.5 bg-gray-100 text-gray-900 rounded text-xs font-mono border border-gray-200">$1</code>');
    
    // Create a line hash for keys
    const lineHash = line.substring(0, Math.min(30, line.length)).replace(/\s/g, '');
    
    // Format headers with proper hierarchy
    if (line.startsWith("### ")) {
      flushAllLists();
      result.push(
        <h3 key={`h3-${index}-${lineHash}`} className="text-lg font-bold mt-6 mb-3 text-gray-900 border-l-4 border-blue-500 pl-3">
          <span key={`h3-span-${lineHash}`} dangerouslySetInnerHTML={{ __html: formattedLine.substring(4) }} />
        </h3>
      );
      return;
    } else if (line.startsWith("## ")) {
      flushAllLists();
      result.push(
        <h2 key={`h2-${index}-${lineHash}`} className="text-2xl font-bold mt-8 mb-4 text-gray-900 border-b-2 border-gray-200 pb-2">
          <span key={`h2-span-${lineHash}`} dangerouslySetInnerHTML={{ __html: formattedLine.substring(3) }} />
        </h2>
      );
      return;
    } else if (line.startsWith("# ")) {
      flushAllLists();
      result.push(
        <h1 key={`h1-${index}-${lineHash}`} className="text-3xl font-bold mt-8 mb-5 text-gray-900 border-b-2 border-blue-500 pb-3">
          <span key={`h1-span-${lineHash}`} dangerouslySetInnerHTML={{ __html: formattedLine.substring(2) }} />
        </h1>
      );
      return;
    }
    
    // Format numbered lists
    const numberedMatch = line.trim().match(/^(\d+)\.\s/);
    if (numberedMatch) {
      flushBulletList(); // If we were in a bullet list, flush it
      inNumberedList = true;
      const itemContent = formattedLine.trim().substring(numberedMatch[0].length);
      const itemHash = itemContent.substring(0, Math.min(20, itemContent.length)).replace(/\s/g, '');
      numberedItems.push(
        <li key={`numbered-item-${numberedItems.length}-${itemHash}`} className="text-base leading-7 text-gray-800 pl-1" dangerouslySetInnerHTML={{ __html: itemContent }} />
      );
      return;
    }
    
    // Format bullet points
    if (line.trim().startsWith("- ") || line.trim().startsWith("* ")) {
      flushNumberedList(); // If we were in a numbered list, flush it
      inBulletList = true;
      const itemContent = formattedLine.trim().substring(2);
      const itemHash = itemContent.substring(0, Math.min(20, itemContent.length)).replace(/\s/g, '');
      bulletItems.push(
        <li key={`bullet-item-${bulletItems.length}-${itemHash}`} className="text-base leading-7 text-gray-800 pl-1" dangerouslySetInnerHTML={{ __html: itemContent }} />
      );
      return;
    }
    
    // If we were in a list and now we're not, flush all lists
    if (inBulletList || inNumberedList) {
      flushAllLists();
    }
    
    // Regular paragraph
    if (line.trim()) {
      result.push(
        <p key={`p-${index}-${lineHash}`} className="mb-4 text-base leading-7 text-gray-800" dangerouslySetInnerHTML={{ __html: formattedLine }} />
      );
      return;
    }
    
    // Empty line - add spacing only if not at the start
    if (result.length > 0 || index > 0) {
      result.push(<div key={`spacer-${index}`} className="h-2" />);
    }
  });
  
  // Flush any remaining list items
  flushAllLists();
  
  return result.length > 0 ? result : <p className="text-base leading-7 text-gray-800">No content</p>;
}

export function MessageContent({ content, className = "" }: MessageContentProps) {
  // Use useMemo to ensure blocks are re-parsed whenever content changes
  // This is critical for streaming updates where content changes frequently
  const blocks = useMemo(() => {
    return parseMessageContent(content);
  }, [content]);

  // Memoize formatted content to ensure React properly tracks changes
  const formattedBlocks = useMemo(() => {
    return blocks.map((block, index) => {
      if (block.type === "code") {
        return {
          type: "code" as const,
          element: (
            <div key={`code-${index}-${block.content.length}`} className="my-6 -mx-1">
              <CodeBlock
                language={block.language || "text"}
                filename={block.filename || `code.${block.language || "txt"}`}
                code={block.content}
              />
            </div>
          )
        };
      } else {
        return {
          type: "text" as const,
          element: (
            <div 
              key={`text-${index}-${block.content.length}-${block.content.substring(0, 10).replace(/\s/g, '')}`} 
              className="whitespace-pre-wrap break-words"
            >
              {formatTextContent(block.content)}
            </div>
          )
        };
      }
    });
  }, [blocks]);

  return (
    <div className={`space-y-4 ${className}`}>
      {formattedBlocks.map((item) => item.element)}
    </div>
  );
}

