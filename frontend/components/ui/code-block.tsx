"use client";
import React from "react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { atomDark } from "react-syntax-highlighter/dist/cjs/styles/prism";
import { IconCheck, IconCopy } from "@tabler/icons-react";

type CodeBlockProps = {
  language: string;
  filename: string;
  highlightLines?: number[];
} & (
  | {
      code: string;
      tabs?: never;
    }
  | {
      code?: never;
      tabs: Array<{
        name: string;
        code: string;
        language?: string;
        highlightLines?: number[];
      }>;
    }
);

export const CodeBlock = ({
  language,
  filename,
  code,
  highlightLines = [],
  tabs = [],
}: CodeBlockProps) => {
  const [copied, setCopied] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState(0);

  const tabsExist = tabs.length > 0;

  const copyToClipboard = async () => {
    const textToCopy = tabsExist ? tabs[activeTab].code : code;
    if (textToCopy) {
      await navigator.clipboard.writeText(textToCopy);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const activeCode = tabsExist ? tabs[activeTab].code : code;
  const activeLanguage = tabsExist
    ? tabs[activeTab].language || language
    : language;
  const activeHighlightLines = tabsExist
    ? tabs[activeTab].highlightLines || []
    : highlightLines;

  return (
    <div className="relative w-full rounded-lg bg-[#1e1e1e] border border-gray-800 shadow-xl overflow-hidden font-mono my-3">
      <div className="flex flex-col gap-2 bg-[#252526] border-b border-gray-800/80">
        {tabsExist && (
          <div className="flex overflow-x-auto px-3 pt-2">
            {tabs.map((tab, index) => (
              <button
                key={index}
                onClick={() => setActiveTab(index)}
                className={`px-3 py-1.5 text-xs transition-colors font-sans rounded-t-md ${
                  activeTab === index
                    ? "text-white bg-[#1e1e1e] border border-b-0 border-gray-700"
                    : "text-gray-400 hover:text-gray-200"
                }`}
              >
                {tab.name}
              </button>
            ))}
          </div>
        )}
        {!tabsExist && (
          <div className="flex justify-between items-center px-3 py-2">
            {filename && (
              <div className="text-xs font-medium text-gray-300 flex items-center gap-1.5">
                <span className="text-gray-500">📄</span>
                <span className="text-xs">{filename}</span>
              </div>
            )}
            {!filename && <div />}
            <button
              onClick={copyToClipboard}
              className="flex items-center gap-1.5 px-2.5 py-1 text-xs text-gray-400 hover:text-white hover:bg-gray-700/50 rounded transition-all font-sans"
              title="Copy code"
            >
              {copied ? (
                <>
                  <IconCheck size={14} className="text-green-400" />
                  <span className="text-green-400 text-xs">Copied!</span>
                </>
              ) : (
                <>
                  <IconCopy size={14} />
                  <span className="text-xs">Copy</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>
      <div className="p-3 overflow-x-auto">
        <SyntaxHighlighter
          language={activeLanguage}
          style={atomDark}
          customStyle={{
            margin: 0,
            padding: 0,
            background: "transparent",
            fontSize: "0.8125rem", // 13px - reduced font size
            lineHeight: "1.5rem", // Better line spacing
          }}
          wrapLines={true}
          showLineNumbers={true}
          lineNumberStyle={{
            minWidth: "2.5em",
            paddingRight: "1em",
            color: "#858585",
            userSelect: "none",
            fontSize: "0.75rem", // Smaller line numbers
          }}
          lineProps={(lineNumber) => ({
            style: {
              backgroundColor: activeHighlightLines.includes(lineNumber)
                ? "rgba(255,255,255,0.08)"
                : "transparent",
              display: "block",
              width: "100%",
              paddingLeft: "0.75em",
            },
          })}
          PreTag="div"
        >
          {String(activeCode)}
        </SyntaxHighlighter>
      </div>
    </div>
  );
};
