"use client";

import React, { useMemo, useState, useEffect } from "react";
import { CodeBlock } from "@/components/ui/code-block";

interface MessageContentProps {
  content: string;
  className?: string;
  isStreaming?: boolean;
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
  const remainingContent = content.substring(lastIndex);
  
  // Check if there's an incomplete code block (starts with ``` but no closing ```)
  const hasIncompleteCodeBlock = /```/.test(remainingContent) && !remainingContent.includes('```', remainingContent.indexOf('```') + 3);
  
  if (remainingContent.trim()) {
    // If there's an incomplete code block, show it as text (will format properly when complete)
    blocks.push({
      type: "text",
      content: remainingContent,
    });
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
  
  let inBulletList = false;
  let inNumberedList = false;
  let bulletItems: React.ReactNode[] = [];
  let numberedItems: React.ReactNode[] = [];
  let result: React.ReactNode[] = [];
  
  const flushBulletList = () => {
    if (bulletItems.length > 0) {
      result.push(
        <ul key={`bullet-list-${result.length}`} className="my-4 space-y-2.5 list-disc list-outside ml-6 pl-2">
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
        <ol key={`numbered-list-${result.length}`} className="my-4 space-y-2.5 list-decimal list-outside ml-6 pl-2">
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
    
    // Format headers with proper hierarchy
    if (line.startsWith("### ")) {
      flushAllLists();
      result.push(
        <h3 key={index} className="text-lg font-bold mt-6 mb-3 text-gray-900 border-l-4 border-blue-500 pl-3">
          <span dangerouslySetInnerHTML={{ __html: formattedLine.substring(4) }} />
        </h3>
      );
      return;
    } else if (line.startsWith("## ")) {
      flushAllLists();
      result.push(
        <h2 key={index} className="text-2xl font-bold mt-8 mb-4 text-gray-900 border-b-2 border-gray-200 pb-2">
          <span dangerouslySetInnerHTML={{ __html: formattedLine.substring(3) }} />
        </h2>
      );
      return;
    } else if (line.startsWith("# ")) {
      flushAllLists();
      result.push(
        <h1 key={index} className="text-3xl font-bold mt-8 mb-5 text-gray-900 border-b-2 border-blue-500 pb-3">
          <span dangerouslySetInnerHTML={{ __html: formattedLine.substring(2) }} />
        </h1>
      );
      return;
    }
    
    // Format numbered lists
    const numberedMatch = line.trim().match(/^(\d+)\.\s/);
    if (numberedMatch) {
      flushBulletList(); // If we were in a bullet list, flush it
      inNumberedList = true;
      numberedItems.push(
        <li key={`numbered-item-${numberedItems.length}`} className="text-base leading-7 text-gray-800 pl-1" dangerouslySetInnerHTML={{ __html: formattedLine.trim().substring(numberedMatch[0].length) }} />
      );
      return;
    }
    
    // Format bullet points
    if (line.trim().startsWith("- ") || line.trim().startsWith("* ")) {
      flushNumberedList(); // If we were in a numbered list, flush it
      inBulletList = true;
      bulletItems.push(
        <li key={`bullet-item-${bulletItems.length}`} className="text-base leading-7 text-gray-800 pl-1" dangerouslySetInnerHTML={{ __html: formattedLine.trim().substring(2) }} />
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
        <p key={index} className="mb-4 text-base leading-7 text-gray-800" dangerouslySetInnerHTML={{ __html: formattedLine }} />
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

export function MessageContent({ content, className = "", isStreaming = false }: MessageContentProps) {
  // Track when streaming completes to force re-render
  const [formatKey, setFormatKey] = useState(0);
  const [wasStreaming, setWasStreaming] = useState(false);

  // Detect when streaming completes and force re-render
  useEffect(() => {
    if (wasStreaming && !isStreaming) {
      // Streaming just completed - force re-render with formatting
      setFormatKey(prev => prev + 1);
    }
    setWasStreaming(isStreaming);
  }, [isStreaming, wasStreaming]);

  // During streaming, show plain text. After streaming completes, format it
  const blocks = useMemo(() => {
    if (!content) return [];
    // If streaming, return plain text block
    if (isStreaming) {
      return [{
        type: "text" as const,
        content: content,
      }];
    }
    // After streaming, parse and format
    return parseMessageContent(content);
  }, [content, isStreaming, formatKey]); // Include formatKey to force re-parse when streaming completes

  return (
    <div key={`content-${formatKey}`} className={`space-y-4 ${className}`}>
      {blocks.map((block, index) => {
        if (block.type === "code") {
          return (
            <div key={`code-${index}-${formatKey}`} className="my-6 -mx-1">
              <CodeBlock
                language={block.language || "text"}
                filename={block.filename || `code.${block.language || "txt"}`}
                code={block.content}
              />
            </div>
          );
        } else {
          // During streaming, show plain text. After streaming, show formatted
          if (isStreaming) {
            return (
              <div key={`text-${index}-${formatKey}`} className="whitespace-pre-wrap break-words text-gray-800">
                {content}
              </div>
            );
          } else {
            return (
              <div key={`text-${index}-${formatKey}`} className="whitespace-pre-wrap break-words">
                {formatTextContent(block.content)}
              </div>
            );
          }
        }
      })}
    </div>
  );
}

