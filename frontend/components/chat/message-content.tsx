"use client";

import React from "react";
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
  // Split by newlines to preserve line breaks
  const lines = text.split("\n");
  
  return lines.map((line, index) => {
    // Format bold text **text**
    let formattedLine = line.replace(/\*\*([^*]+)\*\*/g, '<strong class="font-semibold">$1</strong>');
    
    // Format italic text *text*
    formattedLine = formattedLine.replace(/\*([^*]+)\*/g, '<em class="italic">$1</em>');
    
    // Format inline code `code` - smaller, more subtle
    formattedLine = formattedLine.replace(/`([^`]+)`/g, '<code class="px-1.5 py-0.5 bg-gray-100 text-gray-900 rounded text-xs font-mono border border-gray-200">$1</code>');
    
    // Format headers - reduced but still bold and prominent relative to text
    if (line.startsWith("### ")) {
      return (
        <h3 key={index} className="text-base font-bold mt-4 mb-2 text-gray-900" dangerouslySetInnerHTML={{ __html: formattedLine.substring(4) }} />
      );
    } else if (line.startsWith("## ")) {
      return (
        <h2 key={index} className="text-lg font-bold mt-5 mb-2.5 text-gray-900" dangerouslySetInnerHTML={{ __html: formattedLine.substring(3) }} />
      );
    } else if (line.startsWith("# ")) {
      return (
        <h1 key={index} className="text-xl font-bold mt-5 mb-3 text-gray-900" dangerouslySetInnerHTML={{ __html: formattedLine.substring(2) }} />
      );
    }
    
    // Format bullet points - reduced font size
    if (line.trim().startsWith("- ") || line.trim().startsWith("* ")) {
      return (
        <li key={index} className="ml-5 list-disc mb-1.5 text-sm leading-relaxed text-gray-900" dangerouslySetInnerHTML={{ __html: formattedLine.trim().substring(2) }} />
      );
    }
    
    // Format numbered lists - reduced font size
    const numberedMatch = line.trim().match(/^(\d+)\.\s/);
    if (numberedMatch) {
      return (
        <li key={index} className="ml-5 list-decimal mb-1.5 text-sm leading-relaxed text-gray-900" dangerouslySetInnerHTML={{ __html: formattedLine.trim().substring(numberedMatch[0].length) }} />
      );
    }
    
    // Regular line - reduced font size with good line height
    if (line.trim()) {
      return (
        <p key={index} className="mb-2 text-sm leading-6 text-gray-900" dangerouslySetInnerHTML={{ __html: formattedLine }} />
      );
    }
    
    // Empty line - add spacing
    return <div key={index} className="h-1.5" />;
  });
}

export function MessageContent({ content, className = "" }: MessageContentProps) {
  const blocks = parseMessageContent(content);

  return (
    <div className={`space-y-3 ${className}`}>
      {blocks.map((block, index) => {
        if (block.type === "code") {
          return (
            <div key={index} className="my-4 -mx-1">
              <CodeBlock
                language={block.language || "text"}
                filename={block.filename || `code.${block.language || "txt"}`}
                code={block.content}
              />
            </div>
          );
        } else {
          return (
            <div key={index} className="whitespace-pre-wrap break-words">
              {formatTextContent(block.content)}
            </div>
          );
        }
      })}
    </div>
  );
}

