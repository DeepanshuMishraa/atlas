import { useState, useRef, useEffect } from "react";
import { SyntaxStyle, RGBA } from "@opentui/core";
import type { ScrollBoxRenderable } from "@opentui/core";
import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport, isTextUIPart, isReasoningUIPart, isToolUIPart, isDynamicToolUIPart } from 'ai';
import type { UIMessage } from 'ai';
import { TextInput } from "./input";

const syntaxStyle = SyntaxStyle.fromStyles({
  "markup.heading.1": { fg: RGBA.fromHex("#ff6ec9"), bold: true },
  "markup.heading.2": { fg: RGBA.fromHex("#ff6ec9"), bold: true },
  "markup.heading.3": { fg: RGBA.fromHex("#ff6ec9"), bold: true },
  "markup.list": { fg: RGBA.fromHex("#5e73a8") },
  "markup.raw": { fg: RGBA.fromHex("#a5d6ff") },
  default: { fg: RGBA.fromHex("#f8f8f1") },
});

const formatToolData = (dataStr: string, maxLines = 8): string => {
  if (!dataStr) return "";
  let formatted = dataStr;
  try {
    const parsed = JSON.parse(dataStr);
    formatted = JSON.stringify(parsed, null, 2);
  } catch {
    // keep raw if not JSON
  }
  const lines = formatted.split("\n");
  if (lines.length > maxLines) {
    return lines.slice(0, maxLines).join("\n") + "\n... (truncated)";
  }
  return formatted;
};

function getToolName(part: Record<string, unknown>, isDynamic: boolean): string {
  if (isDynamic) {
    return (part.toolName as string) ?? "unknown";
  }
  const type = part.type as string;
  return type.startsWith("tool-") ? type.slice(5) : type;
}

function getToolState(part: Record<string, unknown>): string {
  return (part.state as string) ?? "unknown";
}

function getToolInput(part: Record<string, unknown>): unknown {
  return part.input;
}

function getToolOutput(part: Record<string, unknown>): unknown {
  return part.output;
}

function getToolError(part: Record<string, unknown>): string | undefined {
  return part.errorText as string | undefined;
}

export function Chat() {
  const { messages, status, sendMessage } = useChat({
    transport: new DefaultChatTransport({
      api: 'http://localhost:8081/chat',
      body: { directory: process.cwd() },
    }),
  });

  const scrollRef = useRef<ScrollBoxRenderable>(null);
  const [expandedToolCalls, setExpandedToolCalls] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSubmit = (text: string) => {
    sendMessage({ text });
  };

  const toggleToolCall = (tcId: string) => {
    setExpandedToolCalls((prev) => ({
      ...prev,
      [tcId]: !prev[tcId],
    }));
  };

  const isStreaming = status === 'submitted' || status === 'streaming';

  if (messages.length === 0) {
    return (
      <box
        alignItems="center"
        justifyContent="center"
        flexGrow={1}
        flexDirection="column"
        backgroundColor="#272a37"
      >
        <box
          flexDirection="column"
          justifyContent="center"
          alignItems="center"
          gap={2}
        >
          <ascii-font font="slick" text="Atlas" color="#ff6ec9" />
          <TextInput onSubmit={handleSubmit} />
        </box>
      </box>
    );
  }

  return (
    <box
      flexDirection="column"
      flexGrow={1}
      width="100%"
      height="100%"
      backgroundColor="#272a37"
      padding={2}
    >
      <scrollbox
        ref={scrollRef}
        flexGrow={1}
        height={15}
        backgroundColor="#272a37"
        focused={false}
        style={{
          rootOptions: { backgroundColor: "#272a37" },
          viewportOptions: { backgroundColor: "#272a37" },
        }}
      >
        <box flexDirection="column" paddingRight={2}>
          {messages.map((msg, idx) => (
            <box key={msg.id} flexDirection="column" marginBottom={2}>
              {msg.role === 'user' && <UserMessage msg={msg} />}
              {msg.role === 'assistant' && (
                <AssistantMessage
                  msg={msg}
                  isStreaming={isStreaming}
                  expandedToolCalls={expandedToolCalls}
                  toggleToolCall={toggleToolCall}
                />
              )}
            </box>
          ))}

          {/* Loading indicator — shown while waiting for response to start */}
          {status === 'submitted' && (
            <box flexDirection="column" paddingLeft={3} gap={1}>
              <text fg="#5e73a8"><em>thinking...</em></text>
            </box>
          )}
        </box>
      </scrollbox>

      <box height={1} />
      <box alignItems="center" width="100%">
        <TextInput onSubmit={handleSubmit} />
      </box>
    </box>
  );
}

function UserMessage({ msg }: { msg: UIMessage; }) {
  const userText = msg.parts
    .filter(isTextUIPart)
    .map((p) => p.text)
    .join("");

  return (
    <box border={["left"]} borderColor="#ff6ec9" paddingLeft={2} marginBottom={1}>
      <text fg="#f8f8f1"><strong>{userText}</strong></text>
    </box>
  );
}

function AssistantMessage({
  msg,
  isStreaming,
  expandedToolCalls,
  toggleToolCall,
}: {
  msg: UIMessage;
  isStreaming: boolean;
  expandedToolCalls: Record<string, boolean>;
  toggleToolCall: (id: string) => void;
}) {
  const reasoningParts = msg.parts.filter(isReasoningUIPart);
  const textParts = msg.parts.filter(isTextUIPart);

  const thoughtText = reasoningParts.map((p) => p.text).join("\n");
  const responseText = textParts.map((p) => p.text).join("");

  // Extract all tool-like parts
  const toolParts = msg.parts.filter(p => isToolUIPart(p) || isDynamicToolUIPart(p)) as Record<string, unknown>[];

  return (
    <box flexDirection="column" paddingLeft={3} gap={1}>
      {thoughtText && <text fg="#5e73a8">{thoughtText}</text>}

      {toolParts.map((part, tcIdx) => {
        const isDynamic = (part.type as string) === 'dynamic-tool';
        const toolName = getToolName(part, isDynamic);
        const state = getToolState(part);
        const input = getToolInput(part);
        const output = getToolOutput(part);
        const errorText = getToolError(part);

        const partId = `${msg.id}-tool-${tcIdx}`;
        const isExpanded = !!expandedToolCalls[partId];
        const isCalling = state === 'input-streaming' || state === 'input-available';
        const isFailed = state === 'output-error';
        const isDone = state === 'output-available';

        const borderColor = isCalling ? "#ff6ec9" : isFailed ? "#FF7B72" : "#43475c";
        const titleColor = isCalling ? "#ff6ec9" : isFailed ? "#FF7B72" : "#a5d6ff";
        const titleText = isCalling
          ? ` ⚙ RUNNING: ${toolName} `
          : isFailed
            ? ` ✗ FAILED: ${toolName} `
            : ` ✓ SUCCESS: ${toolName} `;

        if (!isExpanded) {
          let statusIcon = isDone ? "✓" : isCalling ? "⚙" : "✗";
          let textColor = isDone ? "#5e73a8" : isCalling ? "#ff6ec9" : "#FF7B72";
          return (
            <box
              key={partId}
              flexDirection="row"
              onMouseDown={() => toggleToolCall(partId)}
              paddingLeft={1}
              marginY={0.5}
            >
              <text fg={textColor}>
                <strong>{`▸ [${statusIcon} ${toolName}]`}</strong>
              </text>
              <text fg="#43475c"><em> - click to expand</em></text>
            </box>
          );
        }

        return (
          <box
            key={partId}
            flexDirection="column"
            border={true}
            borderStyle="rounded"
            borderColor={borderColor}
            title={titleText}
            titleColor={titleColor}
            paddingX={1}
            marginY={1}
            width={70}
            onMouseDown={() => toggleToolCall(partId)}
          >
            {input != null && (
              <box flexDirection="column" marginTop={1}>
                <text fg="#5e73a8"><strong>Parameters:</strong></text>
                <text fg="#f8f8f1">{formatToolData(
                  typeof input === 'string' ? input : JSON.stringify(input, null, 2),
                  6
                )}</text>
              </box>
            )}

            {isDone && output != null && (
              <box flexDirection="column" marginTop={1} marginBottom={1}>
                <text fg="#5e73a8"><strong>Result:</strong></text>
                <text fg="#a5d6ff">{formatToolData(
                  typeof output === 'string' ? output : JSON.stringify(output, null, 2),
                  10
                )}</text>
              </box>
            )}

            {isFailed && errorText && (
              <box flexDirection="column" marginTop={1} marginBottom={1}>
                <text fg="#FF7B72"><strong>Error:</strong> {errorText}</text>
              </box>
            )}

            {isCalling && (
              <box marginTop={1} marginBottom={1}>
                <text fg="#ff6ec9"><em>executing tool command...</em></text>
              </box>
            )}

            <box marginTop={1} marginBottom={0.5} alignSelf="flex-end">
              <text fg="#43475c"><em>(click to collapse)</em></text>
            </box>
          </box>
        );
      })}

      {responseText && <box height={1} />}
      {responseText && (
        <markdown
          content={responseText}
          syntaxStyle={syntaxStyle}
          conceal={true}
          streaming={isStreaming}
          width={70}
        />
      )}
    </box>
  );
}
